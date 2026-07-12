import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Database, FileSpreadsheet, Download, 
  History, 
  Users, Briefcase, DollarSign, MessageCircle,
  Package, ChevronRight, HelpCircle, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { importsApi, type ImportJob } from '../services/importsApi';
import { inventoryApi } from '../services/inventoryApi';
import { LoadingState } from '../components/ui/States';
import { InventoryImportModal } from '../components/imports/InventoryImportModal';
import { useToast } from '../components/ui/ToastContext';
import { Modal } from '../components/ui/Modal';

export default function DataImportPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { showToast } = useToast();

  const fetchJobs = async () => {
    try {
      setHasError(false);
      const response = await importsApi.listJobs();
      
      // Aggressive normalization
      const normalizedJobs = Array.isArray(response) ? response : [];
          
      setJobs(normalizedJobs);
    } catch (err) {
      console.error('Import jobs load failed:', err);
      setHasError(true);
      showToast('Aktarım geçmişi yüklenirken bir hata oluştu.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void importsApi.listJobs().then(setJobs).catch((err: unknown) => {
      console.error('Import jobs load failed:', err);
      setHasError(true);
      showToast('Aktarım geçmişi yüklenirken bir hata oluştu.', 'error');
    }).finally(() => setIsLoading(false));
  }, [showToast]);

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="default">Belirsiz</Badge>;
    switch (status) {
      case 'completed': return <Badge variant="success">Tamamlandı</Badge>;
      case 'previewed': return <Badge variant="info">Önizlendi</Badge>;
      case 'failed': return <Badge variant="error">Hata</Badge>;
      case 'uploaded': return <Badge variant="default">Yüklendi</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleComingSoon = () => {
    showToast('Bu aktarım tipi bir sonraki sürümde aktif olacak.', 'info');
  };

  if (isLoading && jobs.length === 0) return <LoadingState message="Aktarım geçmişi yükleniyor..." />;

  const importTypes = [
    { key: 'inventory', name: 'Stok Listesi', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50', active: true, description: 'Ürün, miktar ve fiyat verilerinizi toplu olarak aktarın.' },
    { key: 'customers', name: 'Müşteri Listesi', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', active: false, description: 'Müşteri rehberinizi Excel üzerinden sisteme taşıyın.' },
    { key: 'jobs', name: 'İş / Sipariş Listesi', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-50', active: false, description: 'Mevcut iş ve sipariş kayıtlarınızı içe aktarın.' },
    { key: 'finance', name: 'Finans Kayıtları', icon: DollarSign, color: 'text-teal-500', bg: 'bg-teal-50', active: false, description: 'Gelir-gider ve kasa hareketlerinizi topluca ekleyin.' },
    { key: 'complaints', name: 'Şikayet / Talepler', icon: MessageCircle, color: 'text-red-500', bg: 'bg-red-50', active: false, description: 'Müşteri taleplerini ve şikayet geçmişini aktarın.' },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('tr-TR');
    } catch {
      return '-';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('tr-TR');
    } catch {
      return '';
    }
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-10 pb-6 sm:pb-20">
      <div className="flex items-start justify-between gap-3 sm:gap-6">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-extrabold text-text-high tracking-tight flex items-start sm:items-center gap-2 sm:gap-3 break-words">
            <Database className="w-7 h-7 sm:w-10 sm:h-10 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
            Veri Aktarım Merkezi
          </h1>
          <p className="text-sm sm:text-base text-text-body font-medium max-w-2xl leading-relaxed">
            Excel’de tuttuğunuz müşteri, stok, iş/sipariş, finans ve şikayet verilerini Tavelya’ya güvenli şekilde aktarın.
          </p>
        </div>
        <button type="button" onClick={() => setIsHelpOpen(true)} aria-label="Aktarım süreci hakkında bilgi" title="Aktarım süreci hakkında bilgi" className="w-11 h-11 flex-shrink-0 rounded-2xl border border-border bg-white text-primary shadow-soft flex items-center justify-center hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Import Grid */}
      <section aria-labelledby="import-type-title" className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div><p className="text-[10px] font-black uppercase tracking-widest text-primary">1. Veri türünü seçin</p><h2 id="import-type-title" className="text-lg sm:text-xl font-jakarta font-bold text-text-high">Yeni veri aktarımı</h2></div>
          <span className="hidden sm:inline text-xs text-text-body">Şablonu indirin veya aktarımı başlatın.</span>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
        {importTypes.map((type) => (
          <Card key={type.key} noPadding className={`min-w-0 w-full hover:shadow-xl transition-all duration-300 border-none shadow-soft flex flex-col h-full ${type.active ? 'bg-white ring-1 ring-primary/10 sm:col-span-2 xl:col-span-1' : 'opacity-60 bg-surface-dim/20'}`}>
            <div className="p-4 sm:p-6 lg:p-7 flex flex-col h-full min-w-0">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className={`p-3 sm:p-4 rounded-2xl ${type.bg} ${type.color}`}>
                  <type.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                {!type.active ? (
                  <Badge variant="default" className="bg-text-body/10 text-text-body">Yakında</Badge>
                ) : (
                  <Badge variant="success" className="bg-emerald-50 text-emerald-600">Aktif</Badge>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-jakarta font-bold text-text-high mb-2 sm:mb-3">{type.name}</h3>
              <p className="text-xs text-text-body font-medium leading-relaxed mb-4 sm:mb-6 flex-grow">
                {type.description}
              </p>
              <div className="space-y-2 sm:space-y-3">
                {type.active && (
                  <a href={inventoryApi.getTemplateUrl()} download className="block">
                    <Button variant="outline" className="w-full text-[11px] font-bold min-h-11 border-dashed">
                      <Download className="w-3.5 h-3.5 mr-2" /> 2. Şablonu İndir (.xlsx)
                    </Button>
                  </a>
                )}
                <Button 
                  variant={type.active ? 'primary' : 'outline'} 
                  className="w-full font-bold shadow-lg shadow-primary/10"
                  onClick={type.active ? () => setIsImportModalOpen(true) : handleComingSoon}
                >
                  {type.active ? '3. Dosya Seç ve Aktar' : 'Bir Sonraki Sürüm'} <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </section>

      {/* Import History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-jakarta font-bold text-text-high tracking-tight">Aktarım Geçmişi</h2>
          </div>
          {hasError && (
            <Button variant="outline" size="sm" onClick={() => fetchJobs()} className="h-8 text-[10px] font-bold uppercase tracking-widest">
              Yeniden Dene
            </Button>
          )}
        </div>
        
        <Card noPadding className="shadow-xl border-none overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-dim/30 text-[11px] uppercase text-text-body font-black tracking-widest">
                <tr>
                  <th className="px-8 py-5">Tarih / Saat</th>
                  <th className="px-8 py-5">Dosya / Aktarım Tipi</th>
                  <th className="px-8 py-5 text-center">Sonuç Özeti</th>
                  <th className="px-8 py-5 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.isArray(jobs) && jobs.length > 0 ? (
                  jobs.map((job, idx) => (
                    <tr key={job?.id || `job-${idx}`} className="hover:bg-surface-dim/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-bold text-text-high">{formatDate(job?.created_at)}</div>
                        <div className="text-[11px] font-medium text-text-body opacity-50 uppercase tracking-tighter">{formatTime(job?.created_at)}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-extrabold text-[15px] text-text-high group-hover:text-primary transition-colors truncate max-w-[250px]">{job?.filename || 'Adsız Dosya'}</div>
                        <div className="text-[11px] uppercase font-black text-primary/60 tracking-wider mt-1">
                          {job?.import_type === 'inventory' ? 'Stok Listesi' : (job?.import_type || 'Bilinmeyen')}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-6">
                          <div className="text-center">
                            <div className="font-black text-lg text-emerald-600">{job?.imported_rows ?? 0}</div>
                            <div className="text-[9px] font-bold text-text-body uppercase tracking-tighter opacity-60">Aktarılan</div>
                          </div>
                          <div className="text-center">
                            <div className="font-black text-lg text-red-500">{job?.invalid_rows ?? 0}</div>
                            <div className="text-[9px] font-bold text-text-body uppercase tracking-tighter opacity-60">Hatalı</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {getStatusBadge(job?.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-surface-dim flex items-center justify-center">
                          <History className="w-8 h-8 text-text-body/20" />
                        </div>
                        <p className="text-sm text-text-body italic font-medium">
                          {hasError ? 'Aktarım geçmişi yüklenemedi.' : 'Henüz bir aktarım geçmişi bulunmuyor.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <InventoryImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => fetchJobs()}
      />
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Aktarım Süreci Nasıl İşler?" size="lg">
        <div className="space-y-6 pb-[env(safe-area-inset-bottom)]">
          <div className="space-y-3">
            {[
              ['1', 'Veri türünü seçin', 'Aktarmak istediğiniz kayıt türünü seçin. Şu anda kullanılabilir türler Aktif rozetiyle gösterilir.'],
              ['2', 'Şablonu indirin', 'Sütun yapısını korumak için ilgili Excel şablonunu indirin ve verilerinizi bu şablonda hazırlayın.'],
              ['3', 'Dosyayı seçin', 'Hazırladığınız dosyayı seçin veya yükleme alanına sürükleyip bırakın.'],
              ['4', 'Dosyayı kontrol edin', 'Önizleme adımında geçersiz veya eksik satırları kontrol edin; sorunlu verileri aktarım öncesinde düzeltin.'],
              ['5', 'Aktarımı başlatın', 'Kontrolü geçen kayıtları onaylayarak aktarımı tamamlayın.'],
            ].map(([step, title, description]) => <div key={step} className="flex items-start gap-3 p-3 sm:p-4 rounded-2xl bg-surface-dim/30"><span className="w-8 h-8 rounded-full bg-primary text-white flex-shrink-0 flex items-center justify-center text-sm font-black">{step}</span><div className="min-w-0"><h3 className="font-bold text-text-high">{title}</h3><p className="mt-1 text-sm text-text-body leading-relaxed">{description}</p></div></div>)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-border"><div className="flex items-center gap-2 mb-2"><FileSpreadsheet className="w-5 h-5 text-primary" /><h3 className="font-bold text-text-high">Desteklenen veri türleri</h3></div><p className="text-sm text-text-body leading-relaxed">Stok aktarımı aktif durumdadır. Müşteri, iş/sipariş, finans ve şikayet/talep türleri kullanılabilir olduğunda Aktif rozetiyle gösterilir.</p></div>
            <div className="p-4 rounded-2xl border border-border"><div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /><h3 className="font-bold text-text-high">Hata kontrolü</h3></div><p className="text-sm text-text-body leading-relaxed">Dosya önce önizlenir. Geçerli ve hatalı satırlar ayrıştırılır; hata mesajları onay öncesinde gösterilir.</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-body"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kontrol ve onay akışı mevcut aktarım ekranında korunur.</div>
        </div>
      </Modal>
    </div>
  );
}
