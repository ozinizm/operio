import { useState, useEffect } from 'react';
import { 
  Globe, Activity, CheckCircle2, 
  Clock, AlertTriangle, ArrowUpRight, TrendingUp,
  Database, ShieldCheck, Zap
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';
import { Loader2 } from 'lucide-react';

export default function PlatformDashboard() {
  const [stats, setStats] = useState({
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    pilotWorkspaces: 0,
    suspendedWorkspaces: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const workspaces = await platformApi.getWorkspaces();
        setStats({
          totalWorkspaces: workspaces.length,
          activeWorkspaces: workspaces.filter((w: any) => w.status === 'active').length,
          pilotWorkspaces: workspaces.filter((w: any) => w.status === 'pilot').length,
          suspendedWorkspaces: workspaces.filter((w: any) => w.status === 'suspended').length
        });
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Toplam İşletme', value: stats.totalWorkspaces, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Aktif İşletme', value: stats.activeWorkspaces, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Pilot Aşamasında', value: stats.pilotWorkspaces, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Askıya Alınan', value: stats.suspendedWorkspaces, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4" /> Platform Overview
        </div>
        <h1 className="text-4xl font-jakarta font-extrabold text-slate-800 tracking-tight">Platform Paneli</h1>
        <p className="text-slate-500 font-medium">Operio ekosistemi genel durumu ve işletme büyüme istatistikleri.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`bg-white p-8 rounded-[32px] border ${stat.border} shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex items-start justify-between relative z-10">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter">
                <ArrowUpRight className="w-3 h-3" />
                <span>%0.0</span>
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-4xl font-jakarta font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-jakarta font-bold text-slate-800">Sektörel Dağılım</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">İşletmelerin faaliyet gösterdiği ana sektörler.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-6">
             <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-indigo-300" />
                </div>
                <p className="text-slate-500 font-bold">Veri Analizi Bekleniyor</p>
                <p className="text-xs text-slate-400 max-w-xs mt-2">Platform genelindeki sektör verileri yeterli yoğunluğa ulaştığında burada grafiksel olarak gösterilecektir.</p>
             </div>
          </div>
        </div>

        <div className="bg-indigo-900 p-10 rounded-[40px] shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/30 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-jakarta font-bold text-white">Son Kurulumlar</h2>
              <Activity className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <ShieldCheck className="w-8 h-8 text-indigo-200" />
                </div>
                <p className="text-indigo-100 font-bold">Yeni Kurulum Yok</p>
                <p className="text-xs text-indigo-300/70 mt-2">Son 24 saat içerisinde yeni bir işletme kurulumu gerçekleştirilmedi.</p>
              </div>
            </div>
            <button className="w-full mt-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
               Sistem Raporu Al
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
