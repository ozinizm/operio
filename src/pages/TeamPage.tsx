import { useState, useEffect } from 'react';
import { 
  Users2, UserPlus, ShieldAlert, Edit, 
  Loader2,
  Shield, Search, X, 
  UserCheck, ShieldCheck
} from 'lucide-react';
import { teamApi, type TeamMember } from '../services/teamApi';
import { useToast } from '../components/ui/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ROLE_LABELS, enumLabel } from '../utils/statusMaps';
import type { LucideIcon } from 'lucide-react';
import { getErrorMessage } from '../services/apiClient';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [resettingMember, setResettingMember] = useState<TeamMember | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'staff',
    password: '',
    is_active: true
  });
  const [tempPassword, setTempPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      const data = await teamApi.list();
      setMembers(data);
    } catch {
      showToast('Ekip listesi yüklenemedi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void teamApi.list().then(setMembers).catch(() => showToast('Ekip listesi yüklenemedi.', 'error')).finally(() => setIsLoading(false));
  }, [showToast]);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      email: '',
      full_name: '',
      role: 'staff',
      password: Math.random().toString(36).slice(-8),
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      password: '', // Not used for edit
      is_active: member.is_active
    });
    setIsModalOpen(true);
  };

  const handleOpenReset = (member: TeamMember) => {
    setResettingMember(member);
    setTempPassword(crypto.randomUUID().replaceAll('-', '').slice(0, 8));
    setIsResetModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMember) {
        await teamApi.update(editingMember.id, {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active
        });
        showToast('Kullanıcı güncellendi.', 'success');
      } else {
        await teamApi.create(formData);
        showToast('Kullanıcı başarıyla oluşturuldu.', 'success');
      }
      setIsModalOpen(false);
      fetchTeam();
    } catch (error: unknown) {
      showToast(getErrorMessage(error) || 'Bir hata oluştu.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!resettingMember) return;
    setIsSubmitting(true);
    try {
      await teamApi.resetPassword(resettingMember.id, tempPassword);
      showToast('Şifre sıfırlandı.', 'success');
      setIsResetModalOpen(false);
    } catch {
      showToast('Şifre sıfırlanamadı.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) ||
    m.email.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
  );

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string; icon: LucideIcon }> = {
      owner: { label: enumLabel('owner', ROLE_LABELS), color: 'bg-indigo-600', icon: ShieldCheck },
      admin: { label: enumLabel('admin', ROLE_LABELS), color: 'bg-indigo-500', icon: Shield },
      manager: { label: enumLabel('manager', ROLE_LABELS), color: 'bg-blue-500', icon: UserCheck },
      staff: { label: enumLabel('staff', ROLE_LABELS), color: 'bg-slate-500', icon: Users2 },
      finance: { label: 'Finans', color: 'bg-emerald-600', icon: ShieldAlert },
      field: { label: 'Saha', color: 'bg-orange-500', icon: ShieldAlert }
    };
    const config = roles[role] || roles.staff;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider ${config.color}`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white p-4 sm:p-6 lg:p-8 rounded-3xl md:rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-jakarta font-bold text-slate-800 break-words">Ekip Yönetimi</h1>
          <p className="text-slate-500 font-medium mt-1">Çalışma alanınızdaki personelleri ve yetkilerini yönetin.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Personel ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 w-full sm:w-64 transition-all"
            />
          </div>
          <Button className="w-full sm:w-auto rounded-2xl gap-2 h-12 px-6" onClick={handleOpenCreate}>
            <UserPlus className="w-5 h-5" /> Personel Ekle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Ekip</p>
          <p className="text-3xl font-jakarta font-black text-slate-800 mt-1">{members.length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Yöneticiler</p>
          <p className="text-3xl font-jakarta font-black text-indigo-600 mt-1">{members.filter(m => ['owner', 'admin'].includes(m.role)).length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Aktif Personel</p>
          <p className="text-3xl font-jakarta font-black text-emerald-600 mt-1">{members.filter(m => m.is_active).length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Pasif</p>
          <p className="text-3xl font-jakarta font-black text-red-600 mt-1">{members.filter(m => !m.is_active).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ad Soyad</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rol</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Durum</th>
                <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kayıt Tarihi</th>
                <th className="py-5 px-8 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm group-hover:bg-primary group-hover:text-white transition-all">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-jakarta font-bold text-slate-800">{member.full_name}</p>
                        <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    {getRoleBadge(member.role)}
                  </td>
                  <td className="py-5 px-8">
                    <span 
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        member.is_active 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {member.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-xs text-slate-400 font-medium tabular-nums">
                    {format(new Date(member.created_at), 'd MMM yyyy', { locale: tr })}
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-9 px-3 text-amber-600 font-bold hover:bg-amber-50 rounded-xl border border-amber-100" onClick={() => handleOpenReset(member)}>
                        <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Şifre
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 px-3 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl border border-indigo-100" onClick={() => handleOpenEdit(member)}>
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Düzenle
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Users2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Personel bulunamadı.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filteredMembers.map(member => (
          <article key={member.id} className="min-w-0 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-600 font-bold">{member.full_name.charAt(0)}</div>
              <div className="min-w-0 flex-1"><h2 className="font-jakarta font-bold text-slate-800 break-words">{member.full_name}</h2><p className="text-xs text-slate-500 break-all">{member.email}</p></div>
              <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{member.is_active ? 'Aktif' : 'Pasif'}</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100"><div>{getRoleBadge(member.role)}</div><span className="text-[11px] text-slate-400">{format(new Date(member.created_at), 'd MMM yyyy', { locale: tr })}</span></div>
            <div className="grid grid-cols-2 gap-2 mt-4"><Button variant="ghost" size="sm" className="w-full h-10 text-amber-600 border border-amber-100" onClick={() => handleOpenReset(member)}><ShieldAlert className="w-4 h-4 mr-1" /> Şifre</Button><Button variant="ghost" size="sm" className="w-full h-10 text-indigo-600 border border-indigo-100" onClick={() => handleOpenEdit(member)}><Edit className="w-4 h-4 mr-1" /> Düzenle</Button></div>
          </article>
        ))}
        {filteredMembers.length === 0 && <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center text-slate-400">Personel bulunamadı.</div>}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 max-[430px]:items-end max-[430px]:p-0">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-md max-h-[calc(100dvh-2rem)] rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300 flex flex-col max-[430px]:max-h-[calc(100dvh-env(safe-area-inset-top))] max-[430px]:rounded-b-none">
            <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-jakarta font-black text-slate-800">{editingMember ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Lütfen gerekli bilgileri eksiksiz doldurun.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto min-h-0">
              <Input 
                label="Tam Ad Soyad" 
                placeholder="Örn: Ahmet Yılmaz"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
              />
              <Input 
                label="E-posta Adresi" 
                type="email"
                placeholder="ahmet@sirket.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!!editingMember}
                required
              />
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Kullanıcı Rolü</label>
                <select 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="staff">Personel (Sınırlı)</option>
                  <option value="manager">Müdür (İşlemler)</option>
                  <option value="admin">Yönetici (Tam Yetki)</option>
                  <option value="finance">Finans Sorumlusu</option>
                  <option value="field">Saha Personeli</option>
                </select>
              </div>
              {editingMember && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Hesap Durumu</label>
                  <select 
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                  >
                    <option value="true">Aktif (Sisteme Girebilir)</option>
                    <option value="false">Pasif (Giriş Engellendi)</option>
                  </select>
                </div>
              )}
              {!editingMember && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-tight">Geçici Şifre</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono font-bold text-indigo-900 bg-white px-2 py-1 rounded border border-indigo-200">
                      {formData.password}
                    </code>
                    <p className="text-[10px] text-indigo-400 font-medium max-w-[150px] text-right">
                      Kullanıcı ilk girişinde şifresini değiştirmelidir.
                    </p>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full rounded-2xl h-12 font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingMember ? 'Güncelle' : 'Personeli Kaydet')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isResetModalOpen && resettingMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsResetModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-jakarta font-black text-amber-900">Şifre Sıfırla</h3>
                <p className="text-xs text-amber-700 font-medium">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-slate-600 font-medium">
                <span className="font-black text-slate-800">{resettingMember.full_name}</span> kullanıcısı için yeni bir geçici şifre oluşturulacak. Mevcut şifresi iptal edilecektir.
              </p>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Yeni Geçici Şifre</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-black text-slate-800">
                    {tempPassword}
                  </code>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setTempPassword(Math.random().toString(36).slice(-8))}>
                    Yeni Üret
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-2xl border-slate-200" onClick={() => setIsResetModalOpen(false)}>İptal</Button>
                <Button className="flex-1 rounded-2xl bg-amber-600 hover:bg-amber-700" onClick={handleConfirmReset} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Şifreyi Güncelle'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
