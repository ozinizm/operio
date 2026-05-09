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
          <div key={index} className={`bg-white p-8 rounded-[40px] border ${stat.border} shadow-sm hover:shadow-2xl hover:shadow-indigo-100/40 transition-all group relative overflow-hidden active:scale-[0.98]`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-40`} />
            <div className="flex items-start justify-between relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} shadow-sm flex items-center justify-center border border-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Stabil</span>
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-5xl font-jakarta font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-jakarta font-black text-slate-900 tracking-tight">Sektörel Dağılım Analizi</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">İşletmelerin faaliyet gösterdiği ana segmentler.</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-6">
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-indigo-50/50 rounded-[32px] flex items-center justify-center mb-6 shadow-inner">
                  <Database className="w-10 h-10 text-indigo-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-700">Veri Analizi Hazırlanıyor</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mt-2 leading-relaxed font-medium">
                  Sektörel dağılım verileri yeterli örnekleme ulaştığında gerçek zamanlı grafikler burada aktif olacaktır.
                </p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -mr-40 -mt-40 blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-[80px] opacity-30" />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-jakarta font-black text-white tracking-tight">Aktivite Akışı</h2>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-300 backdrop-blur-md">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-6 border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-10 h-10 text-indigo-400/50" />
              </div>
              <p className="text-white font-black text-sm uppercase tracking-widest">Sistem Stabil</p>
              <p className="text-xs text-slate-400 mt-2 font-medium max-w-[200px] leading-relaxed">
                Son 24 saat içerisinde herhangi bir kritik olay veya yeni kurulum kaydedilmedi.
              </p>
            </div>

            <button className="w-full mt-12 py-5 bg-white text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-[0.98]">
               Gelişmiş Sistem Raporu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
