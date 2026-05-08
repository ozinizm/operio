import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Globe, Users, Activity, Settings, 
  ChevronLeft, CheckCircle2, Clock, 
  AlertTriangle, Save, Loader2, UserPlus,
  Layers, ShieldCheck, Mail, Phone, User,
  ToggleLeft, ToggleRight, Archive,
  Search, Calendar, Info, Plus, ShieldAlert,
  Download, Trash2, FileJson
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { WorkspaceHardDeleteModal } from '../../components/platform/WorkspaceHardDeleteModal';

export default function PlatformWorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Tab Data States
  const [members, setMembers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isTabDataLoading, setIsTabDataLoading] = useState(false);

  // Form states
  const [editName, setEditName] = useState('');
  const [editSector, setEditSector] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');

  // Confirmation state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    variant: 'danger' as 'danger' | 'warning' | 'default'
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const data = await platformApi.getWorkspace(Number(id));
      setWorkspace(data);
      setEditName(data.name);
      setEditSector(data.sector || '');
      setEditStatus(data.status);
      setEditPlan(data.plan);
      setEditContactName(data.primary_contact_name || '');
      setEditContactEmail(data.primary_contact_email || '');
      setEditContactPhone(data.primary_contact_phone || '');
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      showToast('İşletme bilgileri yüklenemedi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'users') fetchMembers();
    if (activeTab === 'modules') fetchModules();
    if (activeTab === 'audit') fetchActivities();
  }, [activeTab]);

  const fetchMembers = async () => {
    setIsTabDataLoading(true);
    try {
      const data = await platformApi.getWorkspaceMembers(Number(id));
      setMembers(data);
    } catch (error) {
      showToast('Kullanıcılar yüklenemedi.', 'error');
    } finally {
      setIsTabDataLoading(false);
    }
  };

  const fetchModules = async () => {
    setIsTabDataLoading(true);
    try {
      const data = await platformApi.getWorkspaceModules(Number(id));
      setModules(data);
    } catch (error) {
      showToast('Modüller yüklenemedi.', 'error');
    } finally {
      setIsTabDataLoading(false);
    }
  };

  const fetchActivities = async () => {
    setIsTabDataLoading(true);
    try {
      const data = await platformApi.getWorkspaceActivities(Number(id));
      setActivities(data);
    } catch (error) {
      showToast('Aktivite kayıtları yüklenemedi.', 'error');
    } finally {
      setIsTabDataLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const updated = await platformApi.updateWorkspace(Number(id), {
        name: editName,
        sector: editSector,
        status: editStatus,
        plan: editPlan,
        primary_contact_name: editContactName,
        primary_contact_email: editContactEmail,
        primary_contact_phone: editContactPhone
      });
      setWorkspace(updated);
      showToast('İşletme başarıyla güncellendi.', 'success');
    } catch (error) {
      showToast('Güncelleme sırasında hata oluştu.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModule = async (moduleKey: string, currentEnabled: boolean) => {
    try {
      await platformApi.toggleModule(Number(id), moduleKey, !currentEnabled);
      showToast('Modül durumu güncellendi.', 'success');
      // Update local state optimistically or refetch
      fetchModules();
    } catch (error) {
      // If error, don't show success, just error
      showToast('Modül güncellenemedi.', 'error');
    }
  };

  const openStatusConfirm = (newStatus: string) => {
    const statusMap: any = {
      active: { title: 'İşletmeyi Aktifleştir', desc: 'İşletme tüm fonksiyonlarıyla kullanıma açılacaktır.', variant: 'default' },
      suspended: { title: 'İşletmeyi Askıya Al', desc: 'İşletme kullanıcıları panele erişemeyecek, ancak veriler korunacaktır.', variant: 'warning' },
      archived: { title: 'İşletmeyi Arşivle', desc: 'İşletme arşivlenecek ve sistemden gizlenecektir.', variant: 'danger' }
    };
    
    const config = statusMap[newStatus];
    setConfirmState({
      isOpen: true,
      title: config.title,
      description: config.desc,
      variant: config.variant,
      action: async () => {
        try {
          await platformApi.updateWorkspace(Number(id), { status: newStatus });
          showToast('Durum güncellendi.', 'success');
          fetchData();
        } catch (error) {
          showToast('İşlem başarısız.', 'error');
        }
      }
    });
  };

  const handleResetPassword = async (member: any) => {
    const tempPassword = Math.random().toString(36).slice(-8);
    setConfirmState({
      isOpen: true,
      title: 'Şifre Sıfırla',
      description: `${member.full_name} (${member.email}) kullanıcısı için geçici şifre oluşturulacaktır: ${tempPassword}. Kullanıcı bir sonraki girişinde şifresini değiştirmeye zorlanacaktır. Onaylıyor musunuz?`,
      variant: 'warning',
      action: async () => {
        try {
          await platformApi.resetUserPassword(Number(id), member.user_id, tempPassword);
          showToast('Kullanıcı şifresi başarıyla sıfırlandı.', 'success');
        } catch (error) {
          showToast('Şifre sıfırlanamadı.', 'error');
        }
      }
    });
  };

  const handleExportWorkspace = async () => {
    try {
      const data = await platformApi.exportWorkspace(Number(id));
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `operio-workspace-${workspace.slug}-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Yedek dosyası başarıyla indirildi. Kalıcı silme işleminden önce bu dosyayı güvenli bir yerde saklayın.', 'success');
    } catch (error) {
      showToast('Dışa aktarma sırasında hata oluştu.', 'error');
    }
  };

  const handleHardDelete = async () => {
    if (workspace.status !== 'archived') {
      showToast('Sadece arşivlenmiş işletmeler kalıcı olarak silinebilir.', 'warning');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmHardDelete = async (confirmSlug: string, backupConfirmed: boolean) => {
    setIsDeleting(true);
    try {
      await platformApi.hardDeleteWorkspace(Number(id), confirmSlug, backupConfirmed);
      showToast('İşletme kalıcı olarak silindi.', 'success');
      setIsDeleteModalOpen(false);
      navigate('/platform/workspaces');
    } catch (error: any) {
      showToast(error.message || 'Silme işlemi başarısız.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5" /> Aktif</span>;
      case 'pilot':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> Pilot</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800"><AlertTriangle className="w-3.5 h-3.5" /> Askıda</span>;
      case 'demo':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Globe className="w-3.5 h-3.5" /> Demo</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800"><Archive className="w-3.5 h-3.5" /> Arşivlenmiş</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!workspace) {
    return <div className="p-8 text-center text-text-medium">İşletme bulunamadı.</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: Globe },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'modules', label: 'Modüller', icon: Layers },
    { id: 'audit', label: 'Aktivite Kayıtları', icon: Activity },
    { id: 'settings', label: 'Yönetim', icon: Settings },
  ];

  const availableModules = [
    { key: 'dashboard', label: 'Panel', description: 'İşletme genel durum özeti ve KPI takibi.' },
    { key: 'customers', label: 'Müşteri Yönetimi', description: 'Müşteri veri tabanı ve iletişim geçmişi.' },
    { key: 'jobs', label: 'İş ve Siparişler', description: 'İş emirleri ve sipariş yönetim süreci.' },
    { key: 'settings', label: 'Ayarlar', description: 'İşletme özel yapılandırma ve tanımlar.' },
    { key: 'offers', label: 'Teklif Yönetimi', description: 'Gelişmiş teklif oluşturma ve takip sistemi.' },
    { key: 'tasks', label: 'Görev Yönetimi', description: 'Ekip içi görev atama ve durum takibi.' },
    { key: 'operations', label: 'Operasyon', description: 'Üretim ve iş süreci yönetimi.' },
    { key: 'delivery_service', label: 'Teslimat / Servis', description: 'Saha operasyonları ve teslimat takibi.' },
    { key: 'complaints_requests', label: 'Şikayet & Talep', description: 'Müşteri geri bildirim yönetim sistemi.' },
    { key: 'finance', label: 'Finans', description: 'Gelir-gider takibi ve finansal raporlama.' },
    { key: 'inventory', label: 'Stok Yönetimi', description: 'Stok ve demirbaş takibi.' },
    { key: 'data_import', label: 'Veri Aktarımı', description: 'Excel ve toplu veri içe aktarma araçları.' },
    { key: 'reports', label: 'Raporlar', description: 'Gelişmiş analitik ve görsel raporlama.' },
    { key: 'notifications', label: 'Bildirimler', description: 'Sistem içi ve e-posta bildirimleri.' },
    { key: 'files', label: 'Dosyalar', description: 'Kurumsal döküman ve dosya saklama.' },
  ];

  const coreModules = ['dashboard', 'customers', 'jobs', 'settings'];

  const handleEnterWorkspace = async () => {
    setConfirmState({
      isOpen: true,
      title: 'İşletme Paneline Geç',
      description: 'Bu işletmenin panelini Platform Yönetici Modu ile görüntüleyeceksiniz. Yapacağınız işlemler sizin kullanıcı hesabınızla kayıt altına alınacaktır. Devam etmek istiyor musunuz?',
      variant: 'default',
      action: async () => {
        try {
          const result = await platformApi.enterWorkspace(Number(id));
          
          // Set local context for platform manager mode
          localStorage.setItem('operio_platform_manager_mode', 'true');
          localStorage.setItem('operio_active_workspace_id', result.workspace_id.toString());
          localStorage.setItem('operio_active_workspace_name', result.workspace_name);
          localStorage.setItem('operio_active_workspace_slug', result.workspace_slug);
          
          showToast(`${result.workspace_name} paneline yönetici moduyla giriş yapıldı.`, 'success');
          
          // Small delay to ensure localStorage is set before navigation
          setTimeout(() => {
            navigate('/dashboard');
            // Force reload or state refresh might be needed if using a global state
            window.location.reload(); 
          }, 500);
        } catch (error) {
          showToast('İşletme paneline geçiş yapılırken bir hata oluştu.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/platform/workspaces')}
          className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:translate-x-[-4px] transition-transform w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> İşletmeler Listesine Dön
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-200">
              {workspace.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-jakarta font-bold text-slate-800">{workspace.name}</h1>
                {getStatusBadge(workspace.status)}
              </div>
              <p className="text-slate-500 font-medium mt-1">Slug: <span className="text-indigo-600 font-bold">/{workspace.slug}</span> • ID: {workspace.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="group relative">
               <Button 
                variant="outline" 
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                onClick={handleEnterWorkspace}
                disabled={workspace.status === 'archived'}
               >
                 İşletme Paneline Geç
               </Button>
               {workspace.status === 'archived' && (
                 <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                   Arşivlenmiş işletmelerin paneline erişilemez.
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">Temel Bilgiler</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Sektör</span>
                    <span className="text-slate-800 font-bold">{workspace.sector || '-'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Plan</span>
                    <span className="text-indigo-600 font-extrabold uppercase">{workspace.plan}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Kuruluş Tarihi</span>
                    <span className="text-slate-800 font-bold">{format(new Date(workspace.created_at), 'd MMMM yyyy', { locale: tr })}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">İletişim Bilgileri</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-100 items-center">
                    <span className="text-slate-500 font-medium flex items-center gap-2"><User className="w-4 h-4" /> Yetkili</span>
                    <span className="text-slate-800 font-bold">{workspace.primary_contact_name || '-'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100 items-center">
                    <span className="text-slate-500 font-medium flex items-center gap-2"><Mail className="w-4 h-4" /> E-posta</span>
                    <span className="text-slate-800 font-bold">{workspace.primary_contact_email}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100 items-center">
                    <span className="text-slate-500 font-medium flex items-center gap-2"><Phone className="w-4 h-4" /> Telefon</span>
                    <span className="text-slate-800 font-bold">{workspace.primary_contact_phone || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex flex-col items-center justify-center text-center space-y-4">
                <ShieldCheck className="w-16 h-16 text-indigo-600 mb-2 opacity-20" />
                <h3 className="text-xl font-bold text-slate-800">İşletme İstatistikleri</h3>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kullanıcılar</p>
                    <p className="text-3xl font-black text-indigo-600 mt-2">{workspace.members_count || 1}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktif Modüller</p>
                    <p className="text-3xl font-black text-indigo-600 mt-2">{workspace.modules_count || 7}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Hızlı Aksiyonlar</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {workspace.status !== 'active' && (
                      <Button variant="outline" className="rounded-xl border-green-200 text-green-700 hover:bg-green-50" onClick={() => openStatusConfirm('active')}>
                        Aktifleştir
                      </Button>
                    )}
                    {workspace.status !== 'suspended' && (
                      <Button variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => openStatusConfirm('suspended')}>
                        Askıya Al
                      </Button>
                    )}
                    {workspace.status !== 'archived' && (
                      <Button variant="outline" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => openStatusConfirm('archived')}>
                        Arşivle
                      </Button>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">İşletme Kullanıcıları</h3>
                <p className="text-sm text-slate-400 mt-1">Bu işletmeye tanımlı personeller ve yetkileri.</p>
              </div>
              <Button size="sm" className="gap-2 rounded-xl bg-indigo-600" disabled>
                <UserPlus className="w-4 h-4" /> Yeni Kullanıcı
              </Button>
            </div>
            
            {isTabDataLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : members.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center">
                 <Users className="w-12 h-12 text-slate-300 mb-4" />
                 <p className="text-slate-500 font-medium">Bu işletme için kullanıcı bulunamadı.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ad Soyad</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-posta</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durum</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kayıt</th>
                      <th className="py-4 px-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-800">{member.full_name}</td>
                        <td className="py-4 px-4 text-sm text-slate-600">{member.email}</td>
                        <td className="py-4 px-4 text-sm">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px] tracking-tight">
                            {member.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {member.is_active ? (
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" title="Aktif" />
                          ) : (
                            <span className="w-2.5 h-2.5 bg-slate-300 rounded-full inline-block" title="Pasif" />
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400">
                          {format(new Date(member.created_at), 'd MMM yyyy', { locale: tr })}
                        </td>
                        <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-amber-600 font-bold hover:bg-amber-50"
                            onClick={() => handleResetPassword(member)}
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Şifre Sıfırla
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-bold" disabled>Düzenle</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="p-10">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Modül Yapılandırması</h3>
                <p className="text-sm text-slate-400 mt-1">İşletmenin erişebileceği özellikleri buradan kontrol edebilirsiniz.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Toplam Aktif</span>
                  <span className="text-lg font-black text-indigo-600">{modules.filter(m => m.is_enabled).length}</span>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Temel</span>
                  <span className="text-lg font-black text-slate-600">{modules.filter(m => m.is_enabled && coreModules.includes(m.module_key)).length}</span>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Ek</span>
                  <span className="text-lg font-black text-indigo-600">{modules.filter(m => m.is_enabled && !coreModules.includes(m.module_key)).length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {/* Temel Modüller */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Temel Modüller</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableModules.filter(mod => coreModules.includes(mod.key)).map((mod) => {
                    return (
                      <div key={mod.key} className="p-6 rounded-[24px] border bg-slate-50/50 border-slate-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-slate-200 text-slate-600">
                            <Layers className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-200/50 px-2 py-1 rounded-lg">Kilitli Modül</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{mod.label === 'Dashboard' ? 'Panel' : mod.label}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Ek Modüller */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Ek Modüller</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableModules.filter(mod => !coreModules.includes(mod.key)).map((mod) => {
                    const moduleData = modules.find(m => m.module_key === mod.key);
                    const isActive = moduleData ? moduleData.is_enabled : false;
                    
                    return (
                      <div key={mod.key} className={`p-6 rounded-[24px] border transition-all ${
                        isActive ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-white border-slate-100'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Layers className="w-5 h-5" />
                          </div>
                          <button 
                            onClick={() => handleToggleModule(mod.key, isActive)}
                            className="transition-transform active:scale-90"
                          >
                            {isActive ? (
                              <ToggleRight className="w-10 h-10 text-indigo-600" />
                            ) : (
                              <ToggleLeft className="w-10 h-10 text-slate-300" />
                            )}
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{mod.label}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Aktivite Kayıtları</h3>
                <p className="text-sm text-slate-400 mt-1">Sadece bu işletmeye ait sistem hareketleri.</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Kayıtlarda ara..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 w-48 transition-all" />
                 </div>
                 <Button variant="outline" size="sm" className="rounded-xl text-xs gap-2 border-slate-200">
                    <Calendar className="w-3.5 h-3.5" /> Filtrele
                 </Button>
              </div>
            </div>
            
            {isTabDataLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center">
                 <Activity className="w-12 h-12 text-slate-300 mb-4" />
                 <p className="text-slate-500 font-medium">Bu işletme için henüz aktivite kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarih</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">İşlem</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kayıt Tipi</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activities.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-4 text-[11px] text-slate-400 font-medium tabular-nums">
                          {format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-tighter">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-400" />
                             <span className="text-xs font-bold text-slate-600">{log.entity_type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-10 max-w-4xl">
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-800">İşletme Bilgilerini Düzenle</h3>
              <p className="text-sm text-slate-400 mt-1">Sistem tanımlamalarını ve yetkili iletişim bilgilerini güncelleyin.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Platform Tanımları</h4>
                <Input 
                  label="İşletme Adı" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                />
                <Input 
                  label="Sektör" 
                  value={editSector} 
                  onChange={(e) => setEditSector(e.target.value)} 
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Durum</label>
                    <select 
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="demo">Demo</option>
                      <option value="pilot">Pilot</option>
                      <option value="active">Aktif</option>
                      <option value="suspended">Askıya Alınan</option>
                      <option value="archived">Arşivlenmiş</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Plan</label>
                    <select 
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Yetkili İletişim</h4>
                <Input 
                  label="Yetkili Adı Soyadı" 
                  value={editContactName} 
                  onChange={(e) => setEditContactName(e.target.value)} 
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                />
                <Input 
                  label="E-posta Adresi" 
                  value={editContactEmail} 
                  onChange={(e) => setEditContactEmail(e.target.value)} 
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                />
                <Input 
                  label="Telefon Numarası" 
                  value={editContactPhone} 
                  onChange={(e) => setEditContactPhone(e.target.value)} 
                  className="rounded-xl border-slate-200 focus:border-indigo-500"
                />
                
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 mt-4">
                   <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                   <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                     E-posta adresi değişikliği yapıldığında, eski adres üzerinden sisteme giriş yapılamayacaktır. Lütfen dikkatli güncelleyin.
                   </p>
                </div>
              </div>
              
              <div className="md:col-span-2 pt-6 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={handleUpdate} 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 rounded-xl shadow-xl shadow-indigo-100 font-bold h-12"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> İşletmeyi Güncelle</>}
                </Button>
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-red-50 rounded-xl text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Tehlikeli İşlemler</h3>
                  <p className="text-sm text-slate-400 mt-1">Bu işlemler geri alınamaz. Lütfen dikkatli olun.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Verileri Yedekle</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        İşletmeye ait tüm meta verileri (müşteriler, teklifler, finans vb.) JSON formatında indirir.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                      <FileJson className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                    onClick={handleExportWorkspace}
                  >
                    <Download className="w-4 h-4 mr-2" /> JSON Olarak Dışa Aktar
                  </Button>
                </div>

                <div className={`p-8 rounded-[32px] border transition-all ${
                  workspace.status === 'archived' ? 'border-red-200 bg-red-50/30' : 'border-slate-100 bg-slate-50/30 opacity-50'
                } space-y-4`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">İşletmeyi Kalıcı Olarak Sil</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        İşletmeyi ve tüm verilerini sistemden kalıcı olarak temizler. Sadece arşivlenmiş işletmeler silinebilir.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className={`w-full rounded-xl font-bold transition-all ${
                      workspace.status === 'archived' 
                        ? 'border-red-200 text-red-700 hover:bg-red-600 hover:text-white' 
                        : 'border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={handleHardDelete}
                    disabled={workspace.status !== 'archived'}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> İşletmeyi Tamamen Sil
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog 
        {...confirmState}
        isOpen={confirmState.isOpen}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          await confirmState.action();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }}
      />

      <WorkspaceHardDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmHardDelete}
        workspaceName={workspace.name}
        workspaceSlug={workspace.slug}
        workspaceStatus={workspace.status}
        isDeleting={isDeleting}
      />
    </div>
  );
}
