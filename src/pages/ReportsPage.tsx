import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Download, 
  Users, Briefcase, TrendingUp, 
  AlertTriangle, DollarSign,
  ChevronRight, Calendar
} from 'lucide-react';
import { reportsApi } from '../services/reportsApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../components/ui/Toast';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const overview = await reportsApi.getOverview();
      setData(overview);
    } catch (err) {
      setError('Rapor verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await reportsApi.exportSummary();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) return <LoadingState message="Raporlar hazırlanıyor..." />;
  if (error) return <ErrorState description={error} onRetry={fetchReport} />;

  const sections = [
    { 
      title: 'Operasyonel Raporlar', 
      items: [
        { label: 'İş Tamamlama Süreleri', value: data.completion_rate + '%' },
        { label: 'Açık İş Sayısı', value: data.open_jobs },
        { label: 'Geciken Görevler', value: data.overdue_tasks }
      ], 
      icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' 
    },
    { 
      title: 'Finansal Raporlar', 
      items: [
        { label: 'Net Kâr', value: formatCurrency(data.net_profit) },
        { label: 'Bekleyen Tahsilat', value: formatCurrency(data.pending_collection) },
        { label: 'Toplam Gelir', value: formatCurrency(data.total_income) }
      ], 
      icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' 
    },
    { 
      title: 'Müşteri Raporları', 
      items: [
        { label: 'Toplam Müşteri', value: data.total_customers },
        { label: 'Aktif Müşteri', value: data.active_customers },
        { label: 'Potansiyel Teklifler', value: data.total_offers }
      ], 
      icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' 
    },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Raporlar</h1>
          <p className="text-sm text-text-body mt-1">Operasyonel ve finansal verimlilik analizleri.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => showToast('Filtreleme yakında eklenecek.', 'info')}><Calendar className="w-4 h-4 mr-2" /> Bu Ay</Button>
          <Button onClick={handleExport} className="shadow-lg shadow-primary/20"><Download className="w-4 h-4 mr-2" /> Özeti Dışa Aktar</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-text-body uppercase tracking-wider">İş Tamamlama Oranı</p>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-high">%{data.completion_rate}</p>
            <span className="text-[10px] text-emerald-600 font-bold mb-1">+2.4%</span>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-text-body uppercase tracking-wider">Net Karlılık</p>
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-high">{formatCurrency(data.net_profit)}</p>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-text-body uppercase tracking-wider">Geciken İşler</p>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-red-600">{data.overdue_tasks}</p>
            <span className="text-[10px] text-text-body font-medium mb-1">Görev</span>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-text-body uppercase tracking-wider">Aktif Müşteriler</p>
            <Users className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-high">{data.active_customers}</p>
            <span className="text-[10px] text-indigo-600 font-bold mb-1">/{data.total_customers}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-all border-none shadow-soft group">
            <div className={`p-3 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${section.bg} ${section.color}`}>
              <section.icon className="w-6 h-6" />
            </div>
            <h3 className="font-jakarta font-bold text-lg text-text-high mb-6">{section.title}</h3>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-dim/30 transition-colors">
                  <span className="text-sm text-text-body font-medium">{item.label}</span>
                  <span className="text-sm font-bold text-text-high">{item.value}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 group/btn">
              Detaylı Analiz <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Card>
        ))}
      </div>

      {/* Visual Summary Placeholder */}
      <Card>
        <CardHeader title="Genel Verimlilik Özeti (Haftalık)" />
        <div className="h-64 flex items-end justify-between gap-4 px-4 pt-10">
          {[40, 25, 60, 35, 70, 50, 65].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3">
              <div className="w-full bg-primary/5 rounded-xl relative group h-full flex items-end">
                <div 
                  className="w-full bg-primary rounded-xl transition-all duration-1000 delay-[200ms] hover:opacity-80" 
                  style={{ height: `${h}%` }} 
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-high text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  %{h}
                </div>
              </div>
              <span className="text-[10px] font-bold text-text-body uppercase">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
