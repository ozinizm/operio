import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, User, 
  Shield, Check, AlertCircle, Info, Loader2,
  Zap, Lock, Mail, Building, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { platformApi, type PlatformModuleDefinition } from '../../services/platformApi';
import { getErrorMessage } from '../../services/apiClient';
import { useToast } from '../../components/ui/ToastContext';

export default function PlatformWorkspaceCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModules, setAvailableModules] = useState<Array<{ key: string; label: string }>>([]);
  const [formData, setFormData] = useState(() => ({
    name: '',
    slug: '',
    sector: '',
    status: 'pilot',
    owner_name: '',
    owner_email: '',
    owner_password: 'Tavelya' + Math.floor(Math.random() * 9000 + 1000) + '!',
    active_modules: [] as string[]
  }));

  useEffect(() => {
    const fetchAvailableModules = async () => {
      try {
        const data = await platformApi.getAvailableModules();
        // The backend returns a list of module definitions
        setAvailableModules(data.map((m: PlatformModuleDefinition) => ({
          key: m.key,
          label: m.name // In module_registry, 'name' is the display label
        })));
      } catch (error) {
        console.error('Failed to fetch available modules:', error);
      }
    };
    fetchAvailableModules();
  }, []);

  const [successData, setSuccessData] = useState<null | { id: number; name: string; owner_email: string; owner_password: string }>(null);
  const [isManuallyEditingSlug, setIsManuallyEditingSlug] = useState(false);

  const slugify = (text: string) => {
    const trMap: Record<string, string> = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    };
    let slug = text;
    for (const key in trMap) {
      slug = slug.replace(new RegExp(key, 'g'), trMap[key]);
    }
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: isManuallyEditingSlug ? prev.slug : slugify(newName)
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManuallyEditingSlug(true);
    setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await platformApi.createWorkspace(formData);
      setSuccessData({
        ...formData,
        id: response.id
      });
      showToast('İşletme başarıyla oluşturuldu.', 'success');
    } catch (error: unknown) {
      console.error('Failed to create workspace:', error);
      showToast(getErrorMessage(error) || 'İşletme oluşturulurken bir hata oluştu.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleModule = (key: string) => {
    setFormData(prev => ({
      ...prev,
      active_modules: prev.active_modules.includes(key)
        ? prev.active_modules.filter(k => k !== key)
        : [...prev.active_modules, key]
    }));
  };

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 py-10">
        <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-indigo-100/50 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-primary to-emerald-500" />
          
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Check className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-jakarta font-black text-slate-900 tracking-tight">Kurulum Başarılı!</h1>
            <p className="text-slate-500 font-medium text-lg">
              <span className="font-bold text-indigo-600">{successData.name}</span> işletmesi ve yönetici hesabı aktif edildi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yönetici E-posta</p>
              <p className="text-sm font-bold text-slate-700">{successData.owner_email}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geçici Şifre</p>
              <p className="text-sm font-bold text-indigo-600 font-mono tracking-wider">{successData.owner_password}</p>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100 flex gap-4 text-left">
            <Info className="w-6 h-6 text-indigo-500 shrink-0" />
            <p className="text-xs text-indigo-800 font-bold leading-relaxed">
              Kullanıcı sisteme ilk girdiğinde bu geçici şifreyi kullanacak ve otomatik olarak şifre değiştirme ekranına yönlendirilecektir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => navigate(`/platform/workspaces/${successData.id}`)}
              className="flex-1 h-16 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              İşletme Detayına Git
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({
                  name: '', slug: '', sector: '', status: 'pilot',
                  owner_name: '', owner_email: '',
                  owner_password: 'Tavelya' + Math.floor(Math.random() * 9000 + 1000) + '!',
                  active_modules: []
                });
                setIsManuallyEditingSlug(false);
              }}
              className="flex-1 h-16 bg-white border-2 border-slate-200 text-slate-600 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Yeni İşletme Kur
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 lg:pb-12">
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/platform/workspaces')}
          className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:translate-x-[-4px] transition-transform w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> İşletmeler Listesine Dön
        </button>
        <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4" /> Yeni Kurulum
        </div>
        <h1 className="text-4xl font-jakarta font-extrabold text-slate-800 tracking-tight">Yeni İşletme Kurulumu</h1>
        <p className="text-slate-500 font-medium">Platform üzerinde yeni bir müşteri ekosistemi ve yönetici hesabı oluşturun.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] gap-6 lg:gap-10 items-start">
        <div className="min-w-0 space-y-6 lg:space-y-10">
          {/* İşletme Bilgileri */}
          <section className="bg-white p-6 sm:p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6 lg:space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16" />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-slate-800 tracking-tight">İşletme Kimlik Bilgileri</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">İşletme Resmi Adı *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all"
                  placeholder="Örn: Bora Mobilya Sanayi"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Sistem Adresi (Slug) *</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus-within:ring-4 focus-within:ring-indigo-50 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                  <span className="text-slate-400 text-sm font-bold">/</span>
                  <input 
                    type="text" 
                    required
                    className="flex-1 bg-transparent border-none outline-none text-sm p-0 ml-0.5 font-bold text-indigo-600"
                    placeholder="boramobilya"
                    value={formData.slug}
                    onChange={handleSlugChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Sektör</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all"
                  placeholder="Örn: Mobilya Üretimi"
                  value={formData.sector}
                  onChange={(e) => setFormData({...formData, sector: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Kurulum Aşaması</label>
                <select 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pilot">Pilot (Sınırlı)</option>
                  <option value="active">Aktif (Tam Erişim)</option>
                  <option value="demo">Demo (Geçici)</option>
                  <option value="suspended">Askıya Alınmış</option>
                </select>
              </div>
            </div>
          </section>

          {/* Yetkili/Admin Bilgileri */}
          <section className="bg-white p-6 sm:p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <User className="w-6 h-6" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-slate-800 tracking-tight">Yetkili & Admin Bilgileri</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Tam Ad Soyad *</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                    type="text" 
                    required
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all"
                    placeholder="Ahmet Yılmaz"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">E-posta (Giriş Adresi) *</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                    type="email" 
                    required
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all"
                    placeholder="ahmet@boramobilya.com"
                    value={formData.owner_email}
                    onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 ml-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  <p className="text-[10px] text-slate-400 font-bold">Kullanıcı mevcutsa yeni şifre ile ilişkilendirilir.</p>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Geçici Sistem Şifresi *</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all"
                      value={formData.owner_password}
                      onChange={(e) => setFormData({...formData, owner_password: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, owner_password: 'Tavelya' + Math.floor(Math.random() * 9000 + 1000) + '!'})}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-extrabold text-slate-600 transition-all uppercase tracking-tighter"
                  >
                    Yeni Üret
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3 px-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <p className="text-[11px] text-slate-400 font-medium">Kullanıcı ilk girişte bu şifreyi kullanacak ve değiştirmesi gerekecektir.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6 lg:space-y-8">
          <div className="lg:sticky lg:top-24 z-10 bg-white/95 backdrop-blur p-4 rounded-[28px] border border-slate-200 shadow-xl">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
              {isSubmitting ? 'İŞLEM SÜRÜYOR...' : 'İŞLETMEYİ KUR'}
            </button>
          </div>

          {/* Modül Seçimi */}
          <section className="bg-white p-6 sm:p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-slate-800 tracking-tight">Aktif Modüller</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest leading-relaxed">
                  Core modüller (Panel, Müşteri, İş, Ayarlar) otomatik olarak aktif edilir.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {availableModules.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleModule(m.key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group ${
                      formData.active_modules.includes(m.key)
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-sm font-bold">{m.label}</span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      formData.active_modules.includes(m.key) ? 'bg-white/20' : 'bg-slate-200'
                    }`}>
                      {formData.active_modules.includes(m.key) ? <Check className="w-4 h-4" /> : <Plus className="w-3.5 h-3.5 opacity-40" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900">Dikkat</p>
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                Bu işlem yeni bir işletme çalışma alanı, yönetici hesabı ve seçilen modül ayarlarını oluşturur.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
