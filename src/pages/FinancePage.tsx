import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ExcelImportActions } from '../components/shared/ExcelImportActions';
import { FinanceEntryModal } from '../components/shared/FinanceEntryModal';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../components/ui/useConfirm';
import { 
  TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Calendar, 
  Search, FileCheck, Plus, Download,
  Edit, Trash2, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';
import { useAuth } from '../context/AuthContextValue';
import { financeApi, type FinanceEntry, type FinanceSummary } from '../services/financeApi';
import { reportsApi } from '../services/reportsApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FINANCE_STATUS_MAP } from '../utils/statusMaps';

export default function FinancePage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);

  const canAccessFinance = ['owner', 'admin', 'finance'].includes(role || '');

  useEffect(() => {
    if (!canAccessFinance) return;
    void Promise.all([financeApi.getSummary(), financeApi.listEntries()]).then(([summaryData, entriesData]) => {
      setSummary(summaryData);
      setEntries(entriesData);
      setError(null);
    }).catch(() => setError('Finans verileri yüklenirken bir hata oluştu.')).finally(() => setLoading(false));
  }, [canAccessFinance]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [summaryData, entriesData] = await Promise.all([
        financeApi.getSummary(),
        financeApi.listEntries()
      ]);
      setSummary(summaryData);
      setEntries(entriesData);
      setError(null);
    } catch {
      setError('Finans verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: 'Kaydı Sil',
      description: 'Bu finans kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await financeApi.deleteEntry(id);
          showToast('Kayıt silindi.', 'success');
          fetchFinanceData();
        } catch {
          showToast('Silme işlemi başarısız.', 'error');
        }
      },
    });
  };

  const handleMarkPaid = async (entry: FinanceEntry) => {
    try {
      await financeApi.updateEntry(entry.id, { ...entry, status: 'paid' });
      showToast('Ödeme durumu güncellendi.', 'success');
      fetchFinanceData();
    } catch {
      showToast('Güncelleme başarısız.', 'error');
    }
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

  const handleNewEntry = () => {
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const filteredEntries = entries.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (!canAccessFinance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-jakarta font-bold text-text-high mb-2">Yetkisiz Erişim</h2>
        <p className="text-text-body max-w-md">
          Bu alan için yetkiniz bulunmuyor. Finansal verilere erişmek için yönetici ile iletişime geçin.
        </p>
      </div>
    );
  }

  if (loading) return <LoadingState message="Finansal veriler yükleniyor..." />;
  if (error) return <ErrorState description={error} onRetry={fetchFinanceData} />;

  const stats = [
    { label: 'Gelir', value: summary?.total_income || 0, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
    { label: 'Gider', value: summary?.total_expense || 0, color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
    { label: 'Net Kâr', value: summary?.net_profit || 0, color: 'text-primary', bg: 'bg-primary/5', icon: TrendingUp },
    { label: 'Bekleyen Tahsilat', value: summary?.pending_collection || 0, color: 'text-amber-600', bg: 'bg-amber-50', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Finans</h1>
          <p className="text-text-body mt-1">İşletmenizin finansal sağlığını ve nakit akışını izleyin.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Dışa Aktar
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" /> Dönem Seç
          </Button>
          <Button onClick={handleNewEntry}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Kayıt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className={`border-none ${s.bg}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-text-body uppercase opacity-70 tracking-wider">{s.label}</p>
                  <h3 className={`text-xl sm:text-2xl font-jakarta font-bold mt-2 ${s.color} break-all`}>
                    {formatCurrency(s.value)}
                  </h3>
                </div>
                <div className={`p-2 rounded-xl bg-white/50 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <span className={`text-[10px] font-bold flex items-center ${s.label === 'Gider' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {s.label === 'Gider' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  Canlı Veri
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" noPadding>
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-jakarta font-bold text-text-high">Son İşlemler</h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
                <input
                  className="w-full pl-9 pr-4 py-2 bg-surface-dim/30 border-none rounded-xl text-sm focus:outline-none"
                  placeholder="Ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <ExcelImportActions />
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-dim/20 text-[10px] uppercase font-bold text-text-body">
                <tr>
                  <th className="px-6 py-3">Tip</th>
                  <th className="px-6 py-3">Açıklama</th>
                  <th className="px-6 py-3 text-right">Tutar</th>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-text-body">İşlem bulunamadı.</td>
                  </tr>
                ) : (
                  filteredEntries.map(t => {
                    const menuItems: ActionMenuItem[] = [
                      {
                        label: 'Düzenle',
                        icon: <Edit className="w-4 h-4" />,
                        onClick: () => handleEditEntry(t),
                      },
                      ...(t.status !== 'paid' ? [{
                        label: 'Ödendi İşaretle',
                        icon: <CheckCircle2 className="w-4 h-4" />,
                        onClick: () => handleMarkPaid(t),
                      }] : []),
                      {
                        label: 'Sil',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => handleDelete(t.id),
                        variant: 'danger' as const,
                      },
                    ];
                    return (
                      <tr key={t.id} className="hover:bg-surface-dim/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-text-high">{t.title}</div>
                          <div className="text-xs text-text-body">{t.customer?.name || t.category || '-'}</div>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-text-high'}`}>
                          {t.type === 'expense' && '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-4 text-text-body text-xs font-medium">
                          {formatDate(t.due_date || t.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={FINANCE_STATUS_MAP[t.status]?.variant || 'default'}>
                            {FINANCE_STATUS_MAP[t.status]?.label || t.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ActionMenu items={menuItems} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-border">
            {filteredEntries.map(t => (
              <div key={t.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-text-high text-sm">{t.title}</div>
                      <div className="text-[10px] text-text-body uppercase">{t.customer?.name || t.category || '-'}</div>
                    </div>
                  </div>
                  <ActionMenu items={[
                    { label: 'Düzenle', icon: <Edit className="w-4 h-4" />, onClick: () => handleEditEntry(t) },
                    { label: 'Sil', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(t.id), variant: 'danger' },
                  ]} />
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant={FINANCE_STATUS_MAP[t.status]?.variant || 'default'}>
                    {FINANCE_STATUS_MAP[t.status]?.label || t.status}
                  </Badge>
                  <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-text-high'}`}>
                    {t.type === 'expense' && '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
                <div className="text-xs text-text-body">{formatDate(t.due_date || t.created_at)}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Hızlı Özet" />
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center p-3 bg-surface-dim/20 rounded-xl">
                <span className="text-sm text-text-body">Vadesi Geçen Tahsilat</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(summary?.overdue_collection || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-dim/20 rounded-xl">
                <span className="text-sm text-text-body">Bekleyen Ödemeler</span>
                <span className="text-sm font-bold text-amber-600">{formatCurrency(summary?.pending_collection || 0)}</span>
              </div>
              <Button className="w-full" variant="outline" onClick={handleNewEntry}>
                <Plus className="w-4 h-4 mr-2" /> Hızlı Kayıt Ekle
              </Button>
            </div>
          </Card>

          <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-200">
            <h3 className="font-jakarta font-bold text-lg mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5" /> Vergi Önemli Notlar
            </h3>
            <p className="text-xs opacity-90 leading-relaxed">
              KDV beyannamesi için son 3 gün. Faturalarınızı sisteme yüklemeyi unutmayın.
            </p>
            <Button
              className="w-full mt-6 bg-white text-indigo-600 hover:bg-surface-dim border-none"
              onClick={() => showToast('Hatırlatıcı eklendi.', 'success')}
            >
              Hatırlatıcı Ekle
            </Button>
          </Card>
        </div>
      </div>

      <FinanceEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSuccess={fetchFinanceData}
        entry={editingEntry}
      />
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
