import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Users, Briefcase, CheckSquare, Truck, 
  AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Activity, FileText, Package, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { dashboardApi } from '../services/dashboardApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useModules } from '../context/ModuleContext';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isModuleEnabled } = useModules();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const summary = await dashboardApi.getSummary();
        setData(summary);
      } catch (err) {
        console.error('Dashboard load failed:', err);
        setError('Dashboard verileri yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) return <LoadingState message="Veriler güncelleniyor..." />;
  if (error) return <ErrorState description={error} onRetry={() => window.location.reload()} />;

  const kpis = [
    { key: 'customers', title: 'Aktif Müşteri', value: data?.active_customers || 0, change: '+12%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50/50', path: '/customers' },
    { key: 'jobs', title: 'Açık İş / Sipariş', value: data?.open_jobs || 0, change: '+5%', trend: 'up', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50/50', path: '/jobs' },
    { key: 'tasks', title: 'Bugünkü Görevler', value: data?.today_tasks || 0, change: '-2', trend: 'down', icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50/50', path: '/tasks' },
    { key: 'offers', title: 'Gönderilen Teklif', value: data?.offer_summary?.sent_offers || 0, change: 'Yeni', trend: 'up', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50/50', path: '/offers' },
    { key: 'offers', title: 'Onaylanan Teklif', value: data?.offer_summary?.approved_offers || 0, change: 'Güncel', trend: 'neutral', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50/50', path: '/offers' },
    { key: 'delivery_service', title: 'Bekleyen Teslimat', value: data?.pending_deliveries || 0, change: 'Planlanan', trend: 'neutral', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50/50', path: '/delivery-service' },
    { key: 'complaints', title: 'Açık Şikayet/Talep', value: data?.open_complaints || 0, change: data?.critical_requests > 0 ? `${data.critical_requests} Kritik` : 'Normal', trend: data?.critical_requests > 0 ? 'down' : 'neutral', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50/50', path: '/complaints' },
    { key: 'finance', title: 'Bekleyen Tahsilat', value: formatCurrency(data?.pending_collection || 0), change: 'Canlı', trend: 'up', icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50/50', path: '/finance' },
    { key: 'inventory', title: 'Kritik Stok', value: data?.low_stock_count || 0, change: 'Kritik', trend: 'down', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50/50', path: '/inventory' },
  ].filter(kpi => isModuleEnabled(kpi.key));

  const getIconForType = (type: string) => {
    switch (type) {
      case 'job': return Briefcase;
      case 'finance': return DollarSign;
      case 'delivery': return Truck;
      case 'complaint': return AlertCircle;
      case 'task': return CheckSquare;
      case 'offer': return FileText;
      case 'inventory': return Package;
      default: return Activity;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'job': return 'bg-indigo-500';
      case 'finance': return 'bg-emerald-500';
      case 'delivery': return 'bg-blue-500';
      case 'complaint': return 'bg-red-500';
      case 'task': return 'bg-amber-500';
      case 'offer': return 'bg-purple-500';
      case 'inventory': return 'bg-emerald-600';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="space-y-10 font-inter pb-20">
      {/* Header Alignment Polish */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-jakarta font-extrabold text-text-high tracking-tight">Hoş Geldiniz, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-text-body font-medium max-w-xl leading-relaxed">Operio sistemindeki güncel özetiniz ve bekleyen işlemleriniz.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="shadow-sm rounded-xl px-6">Rapor Al</Button>
          <div className="lg:hidden">
            <Button className="rounded-xl shadow-lg shadow-primary/20 px-6">Yeni İşlem</Button>
          </div>
        </div>
      </div>

      {/* KPI Grid Polish */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link key={idx} to={kpi.path} className="block group">
              <Card className={`!p-0 hover:shadow-xl transition-all duration-500 border-none shadow-soft flex flex-col h-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${kpi.bg}`}>
                <div className="p-7 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl bg-white shadow-lg shadow-black/[0.03] flex items-center justify-center ${kpi.color} transition-transform duration-500 group-hover:rotate-[10deg]`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="pt-1">
                      {kpi.trend === 'up' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-full flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5"/>{kpi.change}
                        </span>
                      )}
                      {kpi.trend === 'down' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100/50 px-2.5 py-1 rounded-full flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5"/>{kpi.change}
                        </span>
                      )}
                      {kpi.trend === 'neutral' && (
                        <span className="text-[10px] font-bold text-text-body bg-white/80 px-2.5 py-1 rounded-full shadow-sm">
                          {kpi.change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto space-y-1.5">
                    <p className="text-[11px] font-bold text-text-body uppercase opacity-40 tracking-[0.1em]">{kpi.title}</p>
                    <h3 className="text-3xl font-jakarta font-extrabold text-text-high truncate tracking-tight">{kpi.value}</h3>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity Polish */}
        <Card className="col-span-1 lg:col-span-2" noPadding>
          <CardHeader 
            title="Son Aktiviteler" 
            action={<Link to="/reports" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">Tümünü Gör <ChevronRight className="w-4 h-4"/></Link>} 
          />
          <div className="p-6 lg:p-10 pt-4 space-y-0">
            {data?.recent_activities.map((activity: any, i: number) => {
              const Icon = getIconForType(activity.entity_type);
              const color = getColorForType(activity.entity_type);
              return (
                <div key={activity.id} className={`flex items-start gap-5 group cursor-pointer py-6 ${i !== data.recent_activities.length - 1 ? 'border-b border-border/60' : ''}`}>
                  <div className={`w-12 h-12 rounded-[1.25rem] ${color} text-white flex items-center justify-center shadow-lg shadow-current/20 flex-shrink-0 transition-transform group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-[15px] font-bold text-text-high group-hover:text-primary transition-colors leading-snug">{activity.description}</p>
                      <span className="text-[11px] font-bold text-text-body opacity-30 uppercase tracking-widest whitespace-nowrap pt-1">
                        {formatTime(activity.created_at)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-4">
                      <button className="text-[11px] font-black text-primary uppercase tracking-tighter hover:opacity-70 transition-opacity">Detayı Gör</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {data?.recent_activities.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 bg-surface-dim rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-8 h-8 text-text-body/20" />
                </div>
                <p className="text-sm text-text-body italic font-medium">Henüz bir aktivite bulunmuyor.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Sidebar Cards Alignment Polish */}
        <div className="space-y-10">
          <Card noPadding className="shadow-xl">
            <CardHeader title="Yaklaşan Görevler" action={<Link to="/tasks" className="text-xs text-primary font-bold hover:underline">Yönet</Link>} />
            <div className="p-6 lg:p-8 pt-4 space-y-4">
              {data?.upcoming_tasks.map((task: any) => (
                <div key={task.id} className="bg-surface-dim/30 hover:bg-white hover:shadow-xl hover:scale-[1.02] rounded-3xl p-5 border border-transparent hover:border-border transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[14px] font-bold text-text-high group-hover:text-primary transition-colors leading-tight pr-4">{task.title}</h4>
                    <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'} className="shrink-0 scale-90">
                      {formatDate(task.due_date)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-primary"/>
                      </div>
                      <span className="text-[11px] font-bold text-text-body opacity-60">Sorumlu: {task.assignee_user_id}</span>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-primary/10 rounded-xl transition-colors">
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
              ))}
              {data?.upcoming_tasks.length === 0 && (
                <p className="text-sm text-text-body italic text-center py-6">Planlı görev bulunmuyor.</p>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-2xl shadow-indigo-200 p-8 lg:p-10 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-jakarta font-extrabold text-2xl mb-3 tracking-tight">
                Operasyonel Verimlilik
              </h3>
              <p className="text-[13px] opacity-70 leading-relaxed mb-8 font-medium">
                Teklifler onaylandıkça ve işler kapandıkça verimlilik puanınız artar.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Mevcut Durum</span>
                  <span className="text-xl font-black font-jakarta">%{(data?.offer_summary?.approved_offers || 0) * 20}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="h-full bg-white rounded-full shadow-lg transition-all duration-1000 ease-out" 
                    style={{ width: `${(data?.offer_summary?.approved_offers || 0) * 20}%` }} 
                  />
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 transition-transform duration-700 group-hover:scale-125">
              <Activity className="w-48 h-48" />
            </div>
          </Card>
        </div>
      </div>

      {/* Operational Summary Polish */}
      {isModuleEnabled('operations') && (
        <section className="pt-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-2xl font-jakarta font-bold text-text-high tracking-tight">Operasyon Süreç Özeti</h2>
            </div>
            <Link to="/operations" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline transition-all hover:gap-2">
              Süreç Takibine Git <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Yeni / Planlanan', count: (data?.operation_summary?.new || 0) + (data?.operation_summary?.planned || 0), color: 'border-slate-400', bg: 'bg-slate-50' },
              { label: 'Üretim / İşlem', count: data?.operation_summary?.in_progress || 0, color: 'border-blue-400', bg: 'bg-blue-50' },
              { label: 'Beklemede', count: data?.operation_summary?.waiting || 0, color: 'border-amber-400', bg: 'bg-amber-50' },
              { label: 'Tamamlanan', count: data?.operation_summary?.completed || 0, color: 'border-emerald-400', bg: 'bg-emerald-50' },
            ].map((item, i) => (
              <Card key={i} className={`!p-8 border-t-8 ${item.color} ${item.bg} shadow-soft hover:shadow-lg transition-all duration-300`}>
                <p className="text-[11px] font-bold text-text-body uppercase opacity-40 tracking-widest mb-3">{item.label}</p>
                <p className="text-5xl font-jakarta font-black text-text-high tracking-tight">{item.count}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
