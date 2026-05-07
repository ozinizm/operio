import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Globe, 
  Eye, Edit2, 
  CheckCircle2, Clock, AlertTriangle, ShieldOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { platformApi } from '../../services/platformApi';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

export default function PlatformWorkspaces() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Status change states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [pendingStatus, setPendingStatus] = useState('');

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const data = await platformApi.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      showToast('İşletmeler yüklenemedi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleStatusChangeClick = (w: any) => {
    setSelectedWorkspace(w);
    setPendingStatus(w.status === 'suspended' ? 'active' : 'suspended');
    setIsConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedWorkspace) return;
    
    try {
      await platformApi.updateWorkspace(selectedWorkspace.id, {
        status: pendingStatus
      });
      showToast(`İşletme durumu ${pendingStatus === 'active' ? 'aktif' : 'askıya'} alındı.`, 'success');
      fetchWorkspaces();
    } catch (error) {
      showToast('Durum değiştirilemedi.', 'error');
    } finally {
      setIsConfirmOpen(false);
      setSelectedWorkspace(null);
    }
  };

  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (w.primary_contact_email && w.primary_contact_email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3" /> Aktif</span>;
      case 'pilot':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pilot</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3" /> Askıda</span>;
      case 'demo':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Globe className="w-3 h-3" /> Demo</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-jakarta font-bold text-slate-800">İşletmeler</h1>
          <p className="text-slate-500 font-medium">Platforma kayıtlı tüm müşteri workspace'leri.</p>
        </div>
        <Link 
          to="/platform/workspaces/new"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Yeni İşletme Kur
        </Link>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="İşletme adı veya e-posta ile ara..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
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

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">İşletme Adı</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Sektör</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Durum</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Yetkili</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Plan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">Yükleniyor...</td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">İşletme bulunamadı.</td>
                </tr>
              ) : (
                filteredWorkspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{w.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5 tracking-tight italic">/{w.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{w.sector || '-'}</td>
                    <td className="px-8 py-5">{getStatusBadge(w.status)}</td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-800">{w.primary_contact_name || '-'}</p>
                      <p className="text-xs text-slate-400 font-medium">{w.primary_contact_email}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="uppercase text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 tracking-tighter">
                        {w.plan}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => navigate(`/platform/workspaces/${w.id}`)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-xl transition-all" 
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/platform/workspaces/${w.id}`)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-xl transition-all" 
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusChangeClick(w)}
                          className={`p-2.5 rounded-xl transition-all ${
                            w.status === 'suspended' 
                              ? 'text-green-500 hover:bg-green-50 hover:shadow-md' 
                              : 'text-red-400 hover:text-red-600 hover:bg-white hover:shadow-md'
                          }`}
                          title={w.status === 'suspended' ? 'Aktifleştir' : 'Askıya Al'}
                        >
                          {w.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
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

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmStatusChange}
        title={pendingStatus === 'active' ? 'İşletmeyi Aktifleştir' : 'İşletmeyi Askıya Al'}
        description={
          pendingStatus === 'active' 
            ? `${selectedWorkspace?.name} işletmesini tekrar aktifleştirmek istediğinize emin misiniz?` 
            : `${selectedWorkspace?.name} işletmesini askıya almak istediğinize emin misiniz? Bu işlemden sonra işletme kullanıcıları panele erişemeyecektir.`
        }
        confirmLabel={pendingStatus === 'active' ? 'Aktifleştir' : 'Askıya Al'}
        variant={pendingStatus === 'active' ? 'default' : 'danger'}
      />
    </div>
  );
}
