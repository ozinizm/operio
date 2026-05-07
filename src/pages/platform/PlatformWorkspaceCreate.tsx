import { useState } from 'react';
import { 
  ArrowLeft, Save, Globe, User, 
  Shield, Check, AlertCircle, Info, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { platformApi } from '../../services/platformApi';
import { useToast } from '../../components/ui/Toast';

const availableModules = [
  { key: 'offers', label: 'Teklif Yönetimi', icon: 'FileText' },
  { key: 'operations', label: 'Operasyon Takibi', icon: 'Activity' },
  { key: 'delivery_service', label: 'Teslimat & Servis', icon: 'Truck' },
  { key: 'complaints_requests', label: 'Şikayet & Talep', icon: 'AlertCircle' },
  { key: 'finance', label: 'Operasyonel Finans', icon: 'DollarSign' },
  { key: 'inventory', label: 'Stok Yönetimi', icon: 'Package' },
  { key: 'reports', label: 'Gelişmiş Raporlar', icon: 'BarChart2' },
  { key: 'data_import', label: 'Veri Aktarımı', icon: 'FileSpreadsheet' }
];

export default function PlatformWorkspaceCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sector: '',
    status: 'pilot',
    owner_name: '',
    owner_email: '',
    owner_password: 'Operio' + Math.floor(Math.random() * 9000 + 1000) + '!',
    active_modules: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await platformApi.createWorkspace(formData);
      showToast('İşletme başarıyla oluşturuldu.', 'success');
      navigate('/platform/workspaces');
    } catch (error: any) {
      console.error('Failed to create workspace:', error);
      showToast(error.response?.data?.detail || 'İşletme oluşturulurken bir hata oluştu.', 'error');
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/platform/workspaces" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-medium" />
          </Link>
          <div>
            <h1 className="text-2xl font-jakarta font-bold text-text-high">Yeni İşletme Kurulumu</h1>
            <p className="text-text-medium">Yeni bir müşteri workspace'i ve admin kullanıcısı oluşturun.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* İşletme Bilgileri */}
          <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Globe className="w-5 h-5" />
              <h2 className="font-jakarta font-bold text-lg text-text-high">İşletme Bilgileri</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-high">İşletme Adı *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Örn: Bora Mobilya"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-high">Workspace Slug *</label>
                <div className="flex items-center bg-gray-50 border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-white transition-all">
                  <span className="text-text-medium text-sm">operio.com/</span>
                  <input 
                    type="text" 
                    required
                    className="flex-1 bg-transparent border-none outline-none text-sm p-0 ml-1 font-medium"
                    placeholder="boramobilya"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-high">Sektör</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Örn: Mobilya Üretimi"
                  value={formData.sector}
                  onChange={(e) => setFormData({...formData, sector: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-high">Durum</label>
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pilot">Pilot</option>
                  <option value="active">Aktif</option>
                  <option value="demo">Demo</option>
                  <option value="suspended">Askıda</option>
                </select>
              </div>
            </div>
          </section>

          {/* Yetkili/Admin Bilgileri */}
          <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <User className="w-5 h-5" />
              <h2 className="font-jakarta font-bold text-lg text-text-high">Yetkili & Admin Bilgileri</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-high">Ad Soyad *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ahmet Yılmaz"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-high">E-posta (Giriş) *</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="ahmet@boramobilya.com"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-text-high">Geçici Şifre *</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.owner_password}
                    onChange={(e) => setFormData({...formData, owner_password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, owner_password: 'Operio' + Math.floor(Math.random() * 9000 + 1000) + '!'})}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    Yeni Üret
                  </button>
                </div>
                <p className="text-xs text-text-medium flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Kullanıcı ilk girişte bu şifreyi kullanacak.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Modül Seçimi */}
          <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-5 h-5" />
              <h2 className="font-jakarta font-bold text-lg text-text-high">Aktif Modüller</h2>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                <p className="text-xs text-blue-700 font-medium">Core modüller (Panel, Müşteri, İş, Ayarlar) otomatik olarak aktif edilir.</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {availableModules.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleModule(m.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      formData.active_modules.includes(m.key)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-white text-text-medium hover:border-text-medium'
                    }`}
                  >
                    <span className="text-sm font-medium">{m.label}</span>
                    {formData.active_modules.includes(m.key) && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <Clock className="w-6 h-6 animate-spin" />
            ) : (
              <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            {isSubmitting ? 'Oluşturuluyor...' : 'İşletmeyi Oluştur'}
          </button>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Uyarı:</strong> Bu işlem veritabanında yeni bir işletme, bir owner kullanıcı ve bir membership oluşturacaktır. Lütfen bilgilerin doğruluğundan emin olun.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
