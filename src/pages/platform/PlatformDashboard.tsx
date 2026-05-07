import { useState, useEffect } from 'react';
import { 
  Globe, Users, Activity, CheckCircle2, 
  Clock, AlertTriangle, ArrowUpRight, TrendingUp 
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';

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
    { label: 'Toplam İşletme', value: stats.totalWorkspaces, icon: Globe, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Aktif İşletme', value: stats.activeWorkspaces, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pilot Aşamasında', value: stats.pilotWorkspaces, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Askıya Alınan', value: stats.suspendedWorkspaces, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-text-medium">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-jakarta font-bold text-text-high">Platform Yönetimi</h1>
        <p className="text-text-medium">Operio platform genel durumu ve işletme istatistikleri.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
                <span>%0</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-text-medium">{stat.label}</p>
              <h3 className="text-3xl font-jakarta font-bold text-text-high mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-jakarta font-bold text-text-high">Sektörel Dağılım</h2>
            <TrendingUp className="w-5 h-5 text-text-medium" />
          </div>
          <div className="space-y-4">
            <p className="text-text-medium italic">Sektörel veriler analiz ediliyor...</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-jakarta font-bold text-text-high">Son Kurulumlar</h2>
            <Activity className="w-5 h-5 text-text-medium" />
          </div>
          <div className="space-y-4 text-center py-10">
            <Users className="w-12 h-12 text-border mx-auto mb-3" />
            <p className="text-text-medium">Henüz yeni işletme kurulumu yapılmadı.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
