import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Globe, 
  Eye, Edit2, Shield,
  CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { platformApi } from '../../services/platformApi';

export default function PlatformWorkspaces() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await platformApi.getWorkspaces();
        setWorkspaces(data);
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (w.primary_contact_email && w.primary_contact_email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3" /> Aktif</span>;
      case 'pilot':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pilot</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3" /> Askıda</span>;
      case 'demo':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Globe className="w-3 h-3" /> Demo</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">İşletmeler</h1>
          <p className="text-text-medium">Platforma kayıtlı tüm müşteri workspace'leri.</p>
        </div>
        <Link 
          to="/platform/workspaces/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Yeni İşletme Kur
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-medium" />
            <input 
              type="text" 
              placeholder="İşletme adı veya e-posta ile ara..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-text-medium" />
            <select 
              className="bg-white border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="pilot">Pilot</option>
              <option value="suspended">Askıda</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50/30">
                <th className="px-6 py-4 text-sm font-semibold text-text-high">İşletme Adı</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Sektör</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Durum</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Yetkili</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Plan</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-medium">Yükleniyor...</td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-medium">İşletme bulunamadı.</td>
                </tr>
              ) : (
                filteredWorkspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-text-medium font-bold">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-text-high">{w.name}</p>
                          <p className="text-xs text-text-medium">/{w.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-medium">{w.sector || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(w.status)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-high">{w.primary_contact_name || '-'}</p>
                      <p className="text-xs text-text-medium">{w.primary_contact_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="uppercase text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                        {w.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-text-medium hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Detay">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-text-medium hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Düzenle">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-text-medium hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Modüller">
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
