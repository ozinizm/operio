import { useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ExcelImportActions } from '../components/shared/ExcelImportActions';
import { 
  User, Bell, Lock, CreditCard, Database, 
  Save, Download, FileText, Eye, EyeOff,
  Check, Info, ShieldCheck, Globe
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';
import { reportsApi } from '../services/reportsApi';
import { useAuth } from '../context/AuthContextValue';

type Tab = 'Profil' | 'Güvenlik' | 'Bildirimler' | 'Veri Aktarımı' | 'Ödeme & Plan' | 'Sistem';

const TABS: { name: Tab; icon: LucideIcon }[] = [
  { name: 'Profil', icon: User },
  { name: 'Güvenlik', icon: Lock },
  { name: 'Bildirimler', icon: Bell },
  { name: 'Veri Aktarımı', icon: Database },
  { name: 'Ödeme & Plan', icon: CreditCard },
  { name: 'Sistem', icon: Info },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const { user, workspace } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Profil');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    job_assigned: true,
    task_overdue: true,
    comment_added: true,
    file_uploaded: false,
    job_status_changed: true,
  });

  const handleSave = (section?: string) => {
    showToast(`${section || 'Ayarlar'} başarıyla kaydedildi.`, 'success');
  };

  const handleExport = async () => {
    try {
      showToast('Rapor hazırlanıyor...', 'info');
      await reportsApi.exportSummary();
      showToast('Rapor indirildi.', 'success');
    } catch {
      showToast('Dışa aktarma sırasında bir hata oluştu.', 'error');
    }
  };

  const handleBackup = () => {
    showToast('Demo ortamında örnek yedek hazırlanıyor...', 'info');
    setTimeout(() => {
      const backup = {
        exported_at: new Date().toISOString(),
        workspace: workspace?.name,
        note: 'Bu Tavelya demo yedeğidir. Canlı sürümde tam veritabanı yedeği alınacaktır.',
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operio_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Demo yedek indirildi.', 'success');
    }, 800);
  };

  const handleTemplateDownload = () => {
    const csv = 'Müşteri Adı,Sektör,Durum,Yetkili,Telefon,E-posta\nÖrnek Müşteri A.Ş.,Teknoloji,active,Ali Veli,5551234567,ali@ornek.com\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'operio_musteri_sablonu.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Şablon indirildi.', 'success');
  };

  const fieldClass = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelClass = 'block text-xs font-bold text-text-body uppercase opacity-70 mb-1.5';

  return (
    <div className="space-y-8 font-inter max-w-4xl">
      <div>
        <h1 className="text-2xl font-jakarta font-bold text-text-high">Ayarlar</h1>
        <p className="text-text-body mt-1">Sistem tercihlerini ve şirket profilini yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.name
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-text-body hover:bg-surface-dim'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">

          {/* ── Profil ── */}
          {activeTab === 'Profil' && (
            <Card>
              <CardHeader title="Şirket Profili" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={labelClass}>Şirket Adı</label>
                  <input className={fieldClass} defaultValue={workspace?.name || 'Tavelya Demo A.Ş.'} />
                </div>
                <div>
                  <label className={labelClass}>Sektör</label>
                  <input className={fieldClass} defaultValue={workspace?.sector || 'Teknoloji'} />
                </div>
                <div>
                  <label className={labelClass}>Yetkili Adı</label>
                  <input className={fieldClass} defaultValue={user?.full_name || ''} />
                </div>
                <div>
                  <label className={labelClass}>Vergi No</label>
                  <input className={fieldClass} defaultValue="1234567890" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>E-posta</label>
                  <input className={fieldClass} defaultValue={user?.email || 'admin@tavelya.app'} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Adres</label>
                  <input className={fieldClass} defaultValue="İstanbul, Türkiye" />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Button onClick={() => handleSave('Profil')}><Save className="w-4 h-4 mr-2" /> Kaydet</Button>
              </div>
            </Card>
          )}

          {/* ── Güvenlik ── */}
          {activeTab === 'Güvenlik' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Şifre Değiştir" />
                <div className="space-y-4 mt-4">
                  <div>
                    <label className={labelClass}>Mevcut Şifre</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} className={fieldClass} placeholder="••••••••" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-body" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Yeni Şifre</label>
                    <input type="password" className={fieldClass} placeholder="En az 8 karakter" />
                  </div>
                  <div>
                    <label className={labelClass}>Yeni Şifre (Tekrar)</label>
                    <input type="password" className={fieldClass} placeholder="Şifrenizi tekrar girin" />
                  </div>
                  <Button onClick={() => handleSave('Şifre')} className="w-full sm:w-auto">Şifreyi Güncelle</Button>
                </div>
              </Card>

              <Card>
                <CardHeader title="Aktif Oturum Bilgisi" />
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">Bu oturum güvenli</p>
                    <p className="text-xs text-emerald-700">Son giriş: Bugün — Türkiye / Chrome</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── Bildirimler ── */}
          {activeTab === 'Bildirimler' && (
            <Card>
              <CardHeader title="Bildirim Tercihleri" />
              <div className="space-y-4 mt-4">
                {(Object.entries(notifications) as [string, boolean][]).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    job_assigned: 'İş / Sipariş atandığında',
                    task_overdue: 'Görev süresi geçtiğinde',
                    comment_added: 'Yorum eklendiğinde',
                    file_uploaded: 'Dosya yüklendiğinde',
                    job_status_changed: 'İş durumu değiştiğinde',
                  };
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border border-border rounded-2xl">
                      <div>
                        <p className="font-semibold text-sm text-text-high">{labels[key] || key}</p>
                        <p className="text-xs text-text-body mt-0.5">Uygulama içi bildirim</p>
                      </div>
                      <button
                        onClick={() => setNotifications(p => ({ ...p, [key]: !val }))}
                        className={`w-12 h-6 rounded-full transition-all ${val ? 'bg-primary' : 'bg-surface-dim'} relative`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${val ? 'left-6.5' : 'left-0.5'}`} style={{ left: val ? '26px' : '2px' }} />
                      </button>
                    </div>
                  );
                })}
                <Button onClick={() => handleSave('Bildirim Tercihleri')}>
                  <Save className="w-4 h-4 mr-2" /> Kaydet
                </Button>
              </div>
            </Card>
          )}

          {/* ── Veri Aktarımı ── */}
          {activeTab === 'Veri Aktarımı' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Toplu Veri İşlemleri" />
                <div className="mt-4 p-4 bg-surface-dim/30 rounded-2xl">
                  <p className="text-sm text-text-body mb-4">Müşteri, İş ve Finans kayıtlarını toplu olarak yönetin.</p>
                  <ExcelImportActions />
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleTemplateDownload}
                  className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-surface-dim/30 transition-all text-left hover:shadow-md"
                >
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h5 className="text-sm font-bold text-text-high">Şablon İndir</h5>
                    <p className="text-[10px] text-text-body">Müşteri import şablonu (CSV)</p>
                  </div>
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-surface-dim/30 transition-all text-left hover:shadow-md"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Download className="w-5 h-5" /></div>
                  <div>
                    <h5 className="text-sm font-bold text-text-high">Dışa Aktar</h5>
                    <p className="text-[10px] text-text-body">Tüm verileri CSV olarak indir</p>
                  </div>
                </button>

                <button
                  onClick={handleBackup}
                  className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-surface-dim/30 transition-all text-left hover:shadow-md"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Download className="w-5 h-5" /></div>
                  <div>
                    <h5 className="text-sm font-bold text-text-high">Sistem Yedeği Al</h5>
                    <p className="text-[10px] text-text-body">Verileri JSON formatında indir</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-surface-dim/30 transition-all text-left hover:shadow-md"
                >
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h5 className="text-sm font-bold text-text-high">Log Kayıtları</h5>
                    <p className="text-[10px] text-text-body">Son 30 günlük sistem logları</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Ödeme & Plan ── */}
          {activeTab === 'Ödeme & Plan' && (
            <div className="space-y-6">
              <Card className="border-2 border-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Aktif Plan</p>
                    <h3 className="text-2xl font-jakarta font-bold text-text-high mt-1">Pro Plan</h3>
                    <p className="text-text-body text-sm mt-1">5 kullanıcı · 10 GB depolama · Tüm modüller</p>
                  </div>
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">Aktif</span>
                </div>
                <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                  {[['5', 'Kullanıcı'], ['10 GB', 'Depolama'], ['∞', 'İşlem']].map(([v, l]) => (
                    <div key={l}>
                      <p className="text-lg font-bold text-text-high">{v}</p>
                      <p className="text-xs text-text-body">{l}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Fatura Bilgileri" />
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Fatura Adı</label>
                      <input className={fieldClass} defaultValue={workspace?.name || 'Tavelya Demo A.Ş.'} />
                    </div>
                    <div>
                      <label className={labelClass}>Vergi No</label>
                      <input className={fieldClass} defaultValue="1234567890" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Fatura E-postası</label>
                    <input className={fieldClass} defaultValue="fatura@tavelya.app" />
                  </div>
                  <Button onClick={() => handleSave('Fatura Bilgileri')}>
                    <Save className="w-4 h-4 mr-2" /> Kaydet
                  </Button>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-primary to-indigo-700 text-white border-none">
                <h3 className="font-jakarta font-bold text-lg mb-2">Planı Yükselt</h3>
                <p className="text-xs opacity-80 mb-4">Enterprise plan ile sınırsız kullanıcı, özel modüller ve öncelikli destek.</p>
                <Button
                  className="bg-white text-primary hover:bg-surface-dim border-none"
                  onClick={() => showToast('Satış ekibi en kısa sürede sizinle iletişime geçecek.', 'info')}
                >
                  Teklif Al
                </Button>
              </Card>
            </div>
          )}
          {/* ── Sistem ── */}
          {activeTab === 'Sistem' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Sistem Bilgileri" />
                <div className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-surface-dim/30 rounded-2xl border border-border">
                      <p className="text-[10px] font-bold text-text-body uppercase opacity-60 mb-2">Ürün</p>
                      <p className="text-sm font-bold text-text-high">Tavelya</p>
                      <p className="text-xs text-text-body mt-1">Modüler İşletme Yönetim Platformu</p>
                    </div>
                    <div className="p-4 bg-surface-dim/30 rounded-2xl border border-border">
                      <p className="text-[10px] font-bold text-text-body uppercase opacity-60 mb-2">Versiyon</p>
                      <p className="text-sm font-bold text-text-high">v1.2.4-stable</p>
                      <p className="text-xs text-text-body mt-1">Son Güncelleme: 07.05.2026</p>
                    </div>
                    <div className="p-4 bg-surface-dim/30 rounded-2xl border border-border">
                      <p className="text-[10px] font-bold text-text-body uppercase opacity-60 mb-2">Geliştirici</p>
                      <p className="text-sm font-bold text-text-high">Fikir Creative</p>
                      <p className="text-xs text-text-body mt-1">Software & Design Studio</p>
                    </div>
                    <div className="p-4 bg-surface-dim/30 rounded-2xl border border-border">
                      <p className="text-[10px] font-bold text-text-body uppercase opacity-60 mb-2">Yazılım Sahibi</p>
                      <p className="text-sm font-bold text-text-high">Fikir Software</p>
                      <p className="text-xs text-text-body mt-1">Fikir Creative iştirakidir.</p>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary shrink-0">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-base font-jakarta font-bold text-text-high">Lisans Bilgisi</h4>
                      <p className="text-sm text-text-body mt-1">Bu yazılım <strong>Fikir Creative</strong> tarafından lisanslanmıştır. Kullanım hakları saklıdır.</p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                        <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase">Lisanslı Demo</span>
                        <span className="px-3 py-1 bg-white text-text-high border border-border text-[10px] font-bold rounded-lg uppercase">Proprietary</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center gap-6">
                    <a href="https://fikircreative.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                      <Globe className="w-4 h-4" /> Web Sitesi
                    </a>
                    <a href="mailto:info@fikircreative.com" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                      <FileText className="w-4 h-4" /> Destek Talebi
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Log Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Kayıtları" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-text-body mb-4">Son 30 günlük sistem aktivite logları</p>
          {[
            { time: '2026-05-06 00:21', action: 'Kullanıcı girişi', user: 'admin@tavelya.app', level: 'info' },
            { time: '2026-05-05 23:45', action: 'Dosya yüklendi: mutfak_v2.pdf', user: 'admin@tavelya.app', level: 'info' },
            { time: '2026-05-05 22:30', action: 'Yeni müşteri oluşturuldu', user: 'admin@tavelya.app', level: 'info' },
            { time: '2026-05-05 21:00', action: 'Finans kaydı güncellendi', user: 'admin@tavelya.app', level: 'info' },
            { time: '2026-05-04 18:15', action: 'İş durumu değiştirildi: in_progress', user: 'admin@tavelya.app', level: 'info' },
            { time: '2026-05-04 15:00', action: 'Teklif onaylandı', user: 'admin@tavelya.app', level: 'success' },
          ].map((log, i) => (
            <div key={i} className={`p-3 rounded-xl flex items-start gap-3 border ${log.level === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-surface-dim/20'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.level === 'success' ? 'bg-emerald-500' : 'bg-primary'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-high">{log.action}</p>
                <p className="text-xs text-text-body">{log.user} · {log.time}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-text-body italic text-center pt-2">Canlı sürümde gerçek log verileri burada gösterilecektir.</p>
        </div>
      </Modal>
    </div>
  );
}
