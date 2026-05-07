import { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Package, Star, Box, Wrench, Truck, AlertCircle, DollarSign, 
  BarChart2, ShieldCheck, Zap, LayoutGrid, ChevronRight,
  LayoutDashboard, Users, FileText, Briefcase, CheckSquare,
  Settings, Activity, Folder, BarChart3, Bell, 
  FileSpreadsheet, Database, UserCheck, Globe, Car,
  Users2, PieChart, Settings2, MessageCircle, Info,
  Layers, ShoppingBag, CheckCircle2, ArrowRight,
  TrendingUp, Lock, HelpCircle
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog, useConfirm } from '../components/ui/ConfirmDialog';
import { modulesApi } from '../services/modulesApi';
import type { ModuleDefinition } from '../services/modulesApi';
import { useModules } from '../context/ModuleContext';
import { LoadingState } from '../components/ui/States';

const iconMap: Record<string, any> = {
  LayoutDashboard, Users, FileText, Briefcase, CheckSquare, 
  Settings, Activity, Truck, AlertCircle, DollarSign, 
  Folder, BarChart2, BarChart3, Package, Layers, 
  Menu: LayoutGrid, X: LayoutGrid, Bell, Box, FileSpreadsheet, 
  Database, ShieldCheck, UserCheck, Globe, Tool: Wrench, Car,
  Users2, PieChart, Settings2, MessageCircle, Wrench
};

const moduleMetadata: Record<string, { bullets: string[], impact: string }> = {
  offers: { 
    bullets: ["Hızlı teklif hazırlama", "Müşteri onay takibi", "İşe dönüştürme"], 
    impact: "Menü, Hızlı İşlem" 
  },
  operations: { 
    bullets: ["Aşamalı süreç takibi", "Ekip atama", "Durum güncellemeleri"], 
    impact: "Menü, Dashboard" 
  },
  delivery_service: { 
    bullets: ["Teslimat planlama", "Saha servis formları", "Konum takibi"], 
    impact: "Menü, Hızlı İşlem" 
  },
  complaints_requests: { 
    bullets: ["Müşteri talepleri", "Şikayet çözümü", "Destek kayıtları"], 
    impact: "Menü, Hızlı İşlem" 
  },
  files: { 
    bullets: ["Güvenli depolama", "Belge arşivi", "Görsel yükleme"], 
    impact: "Menü" 
  },
  finance: { 
    bullets: ["Gelir-gider özeti", "Tahsilat takibi", "Nakit akış analizi"], 
    impact: "Menü, Dashboard" 
  },
  reports: { 
    bullets: ["Yönetici özetleri", "Finansal tablolar", "Operasyon raporları"], 
    impact: "Menü" 
  },
  inventory: { 
    bullets: ["Ürün/Malzeme listesi", "Kritik stok takibi", "Tedarikçi yönetimi"], 
    impact: "Menü, Dashboard" 
  },
  data_import: { 
    bullets: ["Excel'den toplu aktarım", "Hata denetimi", "Hızlı veri taşıma"], 
    impact: "Menü" 
  },
  notifications: {
    bullets: ["Anlık uyarılar", "Sistem bildirimleri", "İşlem günlüğü"],
    impact: "Bildirim Paneli"
  }
};

const sectorPackMetadata: Record<string, { description: string, icon: any, color: string, features?: string[] }> = {
  small_business_op_pack: {
    description: "Excel ve WhatsApp yerine tüm iş akışınızı dijitalleştirin.",
    icon: Zap,
    color: "bg-primary",
    features: ["Excel'den stok aktarımı", "Şikayet takibi", "İş ve teslimat yönetimi", "Gelir-gider özeti"]
  },
  furniture_production: { 
    description: "Mobilya üretim ve montaj süreçleri için tam entegre çözüm.", 
    icon: Box,
    color: "bg-indigo-500",
    features: ["Aşamalı üretim takibi", "Teslimat planlama", "Hammadde stok yönetimi"]
  },
  technical_service: { 
    description: "Saha servis ve teknik destek ekipleri için optimize edilmiş modüller.", 
    icon: Wrench,
    color: "bg-blue-500",
    features: ["Servis randevuları", "Yedek parça takibi", "Müşteri talepleri"]
  },
  agency_office: { 
    description: "Ofis ve proje yönetimi odaklı, dosya ve finans öncelikli paket.", 
    icon: FileText,
    color: "bg-purple-500",
    features: ["Proje dosya yönetimi", "Finansal özetler", "Anlık bildirimler"]
  }
};

const SECTOR_PACK_RECOMMENDED: Record<string, string[]> = {
  small_business_op_pack: ["complaints_requests", "delivery_service", "finance", "files", "inventory", "data_import", "reports", "notifications", "operations"],
  furniture_production: ["operations", "delivery_service", "complaints_requests", "files", "finance", "reports", "inventory", "data_import"],
  technical_service: ["delivery_service", "complaints_requests", "files", "finance", "reports", "inventory"],
  agency_office: ["operations", "files", "finance", "reports", "notifications", "data_import"]
};

export default function ModulesPage() {
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();
  const { refreshModules } = useModules();
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'store' | 'packs'>('store');

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const data = await modulesApi.list();
      setModules(data);
    } catch (err) {
      showToast('Modüller yüklenirken hata oluştu.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleEnable = async (module: ModuleDefinition) => {
    try {
      setActionLoading(module.key);
      await modulesApi.enable(module.key);
      showToast(`${module.name} modülü aktif edildi.`, 'success');
      await fetchModules();
      await refreshModules();
    } catch (err) {
      showToast('İşlem başarısız.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = (module: ModuleDefinition) => {
    confirm({
      title: `${module.name} Modülünü Devre Dışı Bırak`,
      description: (
        <div className="space-y-3">
          <p>Bu modül menüden ve ilgili ekranlardan kaldırılacak. <strong>Verileriniz silinmez.</strong></p>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-3 items-start">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Modülü tekrar aktif ettiğinizde kaldığınız yerden devam edersiniz.</p>
          </div>
        </div>
      ),
      confirmLabel: 'Devre Dışı Bırak',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(module.key);
          await modulesApi.disable(module.key);
          showToast(`${module.name} modülü devre dışı bırakıldı. Verileriniz silinmedi.`, 'info');
          await fetchModules();
          await refreshModules();
        } catch (err) {
          showToast('İşlem başarısız.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handlePackEnable = (packKey: string, packName: string) => {
    const recommended = SECTOR_PACK_RECOMMENDED[packKey] || [];
    const recommendedModules = modules.filter(m => recommended.includes(m.key));
    
    confirm({
      title: packName,
      description: (
        <div className="space-y-4">
          <p>Bu paketi aktif ettiğinizde aşağıdaki modüller toplu olarak çalışma alanınıza eklenecektir:</p>
          <div className="bg-surface-dim p-4 rounded-2xl max-h-40 overflow-y-auto no-scrollbar grid grid-cols-1 gap-2">
            {recommendedModules.map(m => (
              <div key={m.key} className="flex items-center gap-2 text-xs font-bold text-text-high">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {m.name}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-body">Zaten aktif olan modülleriniz bu işlemden etkilenmez.</p>
        </div>
      ),
      confirmLabel: 'Paketi Aktif Et',
      onConfirm: async () => {
        try {
          setActionLoading(packKey);
          await modulesApi.enablePack(packKey);
          showToast(`${packName} başarıyla uygulandı.`, 'success');
          await fetchModules();
          await refreshModules();
        } catch (err) {
          showToast('Paket yüklenirken hata oluştu.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const counts = useMemo(() => {
    const core = modules.filter(m => m.is_core).length;
    const active = modules.filter(m => !m.is_core && m.is_enabled && m.is_available).length;
    const passive = modules.filter(m => !m.is_core && !m.is_enabled && m.is_available && m.status !== 'coming_soon').length;
    return { core, active, passive };
  }, [modules]);

  if (isLoading) return <LoadingState message="Modül listesi hazırlanıyor..." />;

  const coreModules = modules.filter(m => m.is_core);
  const activeOptionalModules = modules.filter(m => !m.is_core && m.is_enabled && m.is_available);
  const storeModules = modules.filter(m => !m.is_core && !m.is_enabled && m.is_available);
  const futureModules = modules.filter(m => !m.is_available && !m.is_core);

  return (
    <div className="space-y-10 font-inter pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1 uppercase tracking-widest">
            <Layers className="w-4 h-4" />
            Sistem Özelleştirme
          </div>
          <h1 className="text-4xl font-jakarta font-extrabold text-text-high tracking-tight">Modül Merkezi</h1>
          <p className="text-text-body max-w-xl">İşletmenizin ihtiyacına göre modülleri aktif ederek menüyü ve çalışma alanınızı sadeleştirin.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-border shadow-sm self-start">
          <button 
            onClick={() => setViewMode('packs')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'packs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-body hover:bg-surface-dim'}`}
          >
            <Zap className="w-4 h-4" /> Paketle Hızlı Kurulum
          </button>
          <button 
            onClick={() => setViewMode('store')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'store' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-body hover:bg-surface-dim'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Tek Tek Yönet
          </button>
        </div>
      </div>

      {/* Top Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-border shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-body uppercase opacity-60">Aktif Modül</p>
            <h3 className="text-xl font-jakarta font-bold text-text-high">{counts.active}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-border shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-body uppercase opacity-60">Çekirdek Sistem</p>
            <h3 className="text-xl font-jakarta font-bold text-text-high">{counts.core}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-border shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-dim text-text-body flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-body uppercase opacity-60">Pasif Modül</p>
            <h3 className="text-xl font-jakarta font-bold text-text-high">{counts.passive}</h3>
          </div>
        </div>
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase opacity-60">Veri Güvenliği</p>
            <p className="text-[11px] font-bold text-emerald-700 leading-tight">Verileriniz modül kapalıyken de güvendedir.</p>
          </div>
        </div>
      </div>

      {viewMode === 'store' ? (
        <>
          {/* Core System */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-jakarta font-bold text-text-high">Çekirdek Sistem</h2>
              </div>
              <Badge variant="info" className="px-4 py-1.5 rounded-full text-[10px] font-bold">ZORUNLU MODÜLLER</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {coreModules.map(mod => {
                const Icon = iconMap[mod.icon] || LayoutDashboard;
                return (
                  <div key={mod.key} className="bg-surface-dim/40 border border-border border-dashed rounded-3xl p-5 flex flex-col items-center text-center opacity-70">
                    <div className="w-12 h-12 rounded-2xl bg-white text-text-body flex items-center justify-center mb-4 shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-text-high mb-1">{mod.name}</h3>
                    <p className="text-[10px] text-text-body leading-tight opacity-70">{mod.description}</p>
                    <div className="mt-4 pt-4 border-t border-border/50 w-full">
                      <span className="text-[9px] font-black text-text-body/40 uppercase tracking-tighter italic">SİSTEM ÇEKİRDEĞİ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Active Optional Modules */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-jakarta font-bold text-text-high">Aktif Modüller</h2>
              </div>
              {activeOptionalModules.length > 0 && <Badge variant="success" className="px-4 py-1.5 rounded-full text-[10px] font-bold">{activeOptionalModules.length} AKTİF</Badge>}
            </div>
            
            {activeOptionalModules.length === 0 ? (
              <Card className="bg-surface-dim/20 border-dashed border-2 p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-text-body/30">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-jakarta font-bold text-text-high">Henüz aktif iş modülü yok.</h3>
                  <p className="text-sm text-text-body max-w-sm mx-auto mt-1">Aşağıdan bir sektör paketi seçebilir veya modül mağazasından ihtiyacınız olanları aktif edebilirsiniz.</p>
                </div>
                <Button onClick={() => setViewMode('packs')} variant="outline" className="mt-2">
                  Sektör Paketlerini Gör <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOptionalModules.map(mod => <ModuleCard key={mod.key} mod={mod} onAction={handleDisable} loading={actionLoading === mod.key} />)}
              </div>
            )}
          </section>

          {/* Module Store (Passive) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-jakarta font-bold text-text-high">Modül Mağazası</h2>
              </div>
              <Badge variant="default" className="px-4 py-1.5 rounded-full text-[10px] font-bold">TÜMÜNÜ GÖR</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeModules.map(mod => <ModuleCard key={mod.key} mod={mod} onAction={handleEnable} loading={actionLoading === mod.key} />)}
            </div>
          </section>

          {/* Future Modules */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-jakarta font-bold text-text-high">Yakında & Premium</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {futureModules.map(mod => <ModuleCard key={mod.key} mod={mod} onAction={() => {}} disabled />)}
            </div>
          </section>
        </>
      ) : (
        /* Sector Packs View */
        <section className="space-y-8">
          <div className="bg-indigo-600 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden mb-10 shadow-2xl shadow-indigo-200">
            <div className="relative z-10 max-w-2xl">
              <Badge className="bg-white/20 text-white border-white/10 mb-4 px-4 py-1.5 rounded-full font-bold">HIZLI KURULUM</Badge>
              <h2 className="text-3xl lg:text-4xl font-jakarta font-extrabold mb-4 tracking-tight">Sektörünüze Özel Hazır Paketler</h2>
              <p className="text-lg opacity-80 leading-relaxed mb-0">
                Sektörünüzün gereksinim duyduğu en popüler modülleri tek tıkla aktif edin. 
                İhtiyacınıza göre daha sonra istediğiniz modülü tekil olarak açıp kapatabilirsiniz.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
              <Zap className="w-64 h-64 -rotate-12" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.keys(sectorPackMetadata).map(key => (
              <SectorPackCard 
                key={key} 
                packKey={key} 
                modules={modules}
                onActivate={handlePackEnable}
                loading={actionLoading === key}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trust / Data Security Box */}
      <section className="pt-10">
        <div className="bg-surface-dim/30 border border-border rounded-[2.5rem] p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[2rem] bg-white shadow-xl flex items-center justify-center shrink-0 border border-border">
            <ShieldCheck className="w-12 h-12 lg:w-16 lg:h-16 text-emerald-500" />
          </div>
          <div className="space-y-4 text-center lg:text-left">
            <h2 className="text-2xl font-jakarta font-bold text-text-high">Verileriniz Her Zaman Güvende</h2>
            <p className="text-text-body text-base leading-relaxed max-w-2xl">
              Bir modülü devre dışı bıraktığınızda sadece menü, hızlı işlem ve dashboard görünürlüğü değişir. 
              <strong> Kayıtlarınız kesinlikle silinmez.</strong> Modülü tekrar aktif ettiğinizde tüm verileriniz 
              kaldığı yerden geri gelir.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border shadow-sm text-xs font-bold text-text-high">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Veri Kaybı Yok
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border shadow-sm text-xs font-bold text-text-high">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tam Kontrol
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border shadow-sm text-xs font-bold text-text-high">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sade Arayüz
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog {...confirmProps} />
    </div>
  );
}

const categoryMap: Record<string, string> = {
  'customer_service': 'Müşteri Hizmetleri',
  'files_reports': 'Dosya ve Raporlar',
  'operations': 'Operasyon',
  'inventory_assets': 'Stok ve Demirbaş',
  'team': 'Ekip',
  'intelligence': 'İçgörü',
  'finance': 'Finans',
  'core': 'Sistem',
  'sales': 'Satış'
};

function ModuleCard({ mod, onAction, loading }: { 
  mod: ModuleDefinition, 
  onAction: (m: ModuleDefinition) => void, 
  loading?: boolean,
  disabled?: boolean 
}) {
  const meta = moduleMetadata[mod.key];
  const Icon = iconMap[mod.icon] || LayoutDashboard;
  
  const isComingSoon = mod.status === 'coming_soon' || mod.status === 'premium' || (!mod.is_available && !mod.is_core);

  return (
    <Card className={`relative group transition-all duration-500 border-2 overflow-hidden flex flex-col h-full ${
      mod.is_enabled 
        ? 'bg-white border-primary/10 shadow-soft' 
        : isComingSoon 
          ? 'bg-surface-dim/40 border-border/50 border-dashed opacity-70' 
          : 'bg-surface/50 border-transparent hover:border-border/50 hover:bg-white hover:shadow-xl'
    }`}>
      {/* Category Ribbon */}
      <div className="absolute top-4 right-4">
        {(mod.is_enabled && !isComingSoon) ? (
          <Badge variant="success" className="px-3 py-1 text-[10px] font-bold shadow-sm">AKTİF</Badge>
        ) : isComingSoon ? (
          <Badge variant={mod.status === 'premium' ? 'warning' : 'default'} className="px-3 py-1 text-[10px] font-bold">
            {mod.status === 'premium' ? 'PREMIUM' : 'YAKINDA'}
          </Badge>
        ) : (
          <Badge variant="default" className="px-3 py-1 text-[10px] font-bold opacity-50">PASİF</Badge>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-lg ${
          mod.is_enabled 
            ? 'bg-primary text-white shadow-primary/20' 
            : isComingSoon 
              ? 'bg-surface-dim text-text-body shadow-none' 
              : 'bg-white text-text-body shadow-black/5 group-hover:bg-primary group-hover:text-white'
        }`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="space-y-1 mb-4">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            {categoryMap[mod.category] || mod.category}
          </p>
          <h3 className="text-lg font-jakarta font-extrabold text-text-high tracking-tight">{mod.name}</h3>
        </div>

        <p className="text-xs text-text-body leading-relaxed mb-6">
          {mod.description}
        </p>

        {meta && (
          <div className="space-y-4 mb-8 flex-1">
            <div className="space-y-2">
              {meta.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] font-medium text-text-body">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {bullet}
                </div>
              ))}
            </div>
            <div className="bg-surface-dim/50 p-2.5 rounded-xl border border-border/50">
              <p className="text-[9px] font-bold text-text-body uppercase opacity-40 mb-1">Görünürlük Etkisi</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-high">
                <TrendingUp className="w-3 h-3 text-primary" />
                {meta.impact}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pt-0 mt-auto">
        {(mod.is_enabled && !isComingSoon) ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAction(mod)} 
            className="w-full text-[10px] font-bold text-red-600 hover:bg-red-50 hover:border-red-200 border-red-100 rounded-xl"
            isLoading={loading}
          >
            DEVRE DIŞI BIRAK
          </Button>
        ) : isComingSoon ? (
          <Button 
            disabled 
            variant="outline" 
            size="sm" 
            className="w-full text-[10px] font-bold bg-surface-dim/30 rounded-xl"
          >
            BEKLEMEDE
          </Button>
        ) : (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => onAction(mod)} 
            className="w-full text-[10px] font-bold rounded-xl shadow-lg shadow-primary/20"
            isLoading={loading}
          >
            MODÜLÜ AKTİF ET
          </Button>
        )}
      </div>
    </Card>
  );
}

function SectorPackCard({ packKey, modules, onActivate, loading }: { 
  packKey: string, 
  modules: ModuleDefinition[],
  onActivate: (key: string, name: string) => void,
  loading?: boolean
}) {
  const meta = sectorPackMetadata[packKey];
  const recommended = SECTOR_PACK_RECOMMENDED[packKey] || [];
  const packModules = modules.filter(m => recommended.includes(m.key));
  const activeCount = packModules.filter(m => m.is_enabled).length;
  const isAllActive = activeCount === packModules.length && packModules.length > 0;
  
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <Card className={`p-8 lg:p-10 transition-all duration-500 group border-2 relative overflow-hidden flex flex-col h-full ${
      isAllActive 
        ? 'bg-emerald-50/30 border-emerald-500/20 shadow-soft' 
        : 'bg-white border-border hover:border-primary/20 hover:shadow-2xl'
    }`}>
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-8">
          <div className={`w-16 h-16 rounded-[1.5rem] ${meta.color} text-white flex items-center justify-center shadow-2xl shadow-current/30 group-hover:scale-110 transition-all duration-500`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-text-body uppercase opacity-40 mb-1">Modül Sayısı</p>
            <h4 className="text-xl font-jakarta font-black text-text-high">{packModules.length}</h4>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-2xl font-jakarta font-extrabold text-text-high tracking-tight">
            {packKey === 'small_business_op_pack' ? 'Küçük İşletme' : 
             packKey === 'furniture_production' ? 'Mobilya / Üretim' : 
             packKey === 'technical_service' ? 'Teknik Servis' : 
             packKey === 'agency_office' ? 'Ajans / Ofis' : 'Sektör'} Paketi
          </h3>
          <p className="text-xs text-text-body leading-relaxed">{meta.description}</p>
        </div>

        <div className="space-y-6 flex-1">
          {meta.features && (
            <div className="space-y-2">
              {meta.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-text-body">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  {f}
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-high uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Paket İçeriği
            </p>
            <div className="flex flex-wrap gap-2">
              {packModules.map(m => (
                <div key={m.key} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  m.is_enabled 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : 'bg-surface-dim border-border text-text-body group-hover:bg-white'
                }`}>
                  {m.name}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-body uppercase tracking-widest flex items-center gap-2 opacity-50">
              <HelpCircle className="w-3.5 h-3.5" />
              Yakında Eklenecek
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-border border-dashed text-text-body/40 italic">
                {packKey === 'furniture_production' ? 'Kalite Kontrol' : packKey === 'technical_service' ? 'Garanti Takibi' : packKey === 'agency_office' ? 'Onay Süreçleri' : 'Müşteri Portalı'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {isAllActive ? (
            <div className="w-full bg-emerald-500 text-white p-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold">Paket Uygulandı</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onActivate(packKey, packKey === 'furniture_production' ? 'Mobilya / Üretim Paketi' : packKey === 'technical_service' ? 'Teknik Servis Paketi' : 'Sektör Paketi')} 
              className="w-full py-6 rounded-2xl font-bold group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-lg shadow-black/5"
              isLoading={loading}
            >
              PAKETİ AKTİF ET <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
        <Icon className="w-48 h-48 rotate-12 translate-x-12 translate-y-12" />
      </div>
    </Card>
  );
}
