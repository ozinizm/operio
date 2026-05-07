import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Globe, Users, Activity, Settings, 
  ChevronLeft, CheckCircle2, Clock, 
  AlertTriangle, Save, Loader2, UserPlus,
  Layers, ShieldCheck
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function PlatformWorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [editName, setEditName] = useState('');
  const [editSector, setEditSector] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPlan, setEditPlan] = useState('');

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const data = await platformApi.getWorkspace(Number(id));
        setWorkspace(data);
        setEditName(data.name);
        setEditSector(data.sector || '');
        setEditStatus(data.status);
        setEditPlan(data.plan);
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
        showToast('İşletme bilgileri yüklenemedi.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspace();
  }, [id]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const updated = await platformApi.updateWorkspace(Number(id), {
        name: editName,
        sector: editSector,
        status: editStatus,
        plan: editPlan
      });
      setWorkspace(updated);
      showToast('İşletme başarıyla güncellendi.', 'success');
    } catch (error) {
      showToast('Güncelleme sırasında hata oluştu.', 'error');
    } finally {
      setIsSaving(false);
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
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" disabled>
              İşletme Paneline Geç
            </Button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter absolute mt-12 ml-4 invisible md:visible opacity-60">Bir sonraki sürümde aktif edilecektir.</p>
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
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
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
                    <span className="text-slate-800 font-bold">{new Date(workspace.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">İletişim Bilgileri</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Yetkili Kişi</span>
                    <span className="text-slate-800 font-bold">{workspace.primary_contact_name || '-'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">E-posta</span>
                    <span className="text-slate-800 font-bold">{workspace.primary_contact_email}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Telefon</span>
                    <span className="text-slate-800 font-bold">{workspace.primary_contact_phone || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
              <ShieldCheck className="w-16 h-16 text-indigo-600 mb-2 opacity-20" />
              <h3 className="text-xl font-bold text-slate-800">İşletme İstatistikleri</h3>
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kullanıcılar</p>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-1">1</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Modüller</p>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-1">7</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium italic">Gerçek istatistikler platform analiz motoru tarafından hesaplanır.</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800">İşletme Kullanıcıları</h3>
              <Button size="sm" className="gap-2 rounded-xl" disabled>
                <UserPlus className="w-4 h-4" /> Yeni Kullanıcı
              </Button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center py-20">
               <Users className="w-12 h-12 text-slate-300 mb-4" />
               <p className="text-slate-500 font-medium">Bu işletmenin kullanıcı listesi şimdilik işletme paneli üzerinden yönetilmektedir.</p>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="p-10">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Aktif Modüller</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Dashboard', 'Müşteriler', 'İş ve Siparişler', 'Görevler', 'Ayarlar', 'Modüller', 'Bildirimler'].map((mod) => (
                <div key={mod} className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900">{mod}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Core Modül</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-10">
            <h3 className="text-xl font-bold text-slate-800 mb-6">İşletme Aktivite Kayıtları</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center py-24">
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium mb-1">Bu işletmeye özel aktivite kaydı bulunamadı.</p>
              <p className="text-xs text-slate-400">Tüm sistem aktivitelerini Aktivite Kayıtları sayfasından görebilirsiniz.</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-10 max-w-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-8">İşletme Ayarlarını Düzenle</h3>
            <div className="space-y-6">
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
              
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={handleUpdate} 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl shadow-lg shadow-indigo-100 font-bold h-12"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
