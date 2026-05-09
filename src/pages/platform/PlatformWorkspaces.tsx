import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Globe, 
  Eye, Loader2, Mail,
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">İşletme Adı</th>
                <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Sektör</th>
                <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Durum</th>
                <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Yetkili</th>
                <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Plan</th>
                <th className="px-8 py-5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-600/30" />
                      <p className="text-sm font-bold text-slate-400 italic">İşletmeler yükleniyor...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Globe className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-slate-600">İşletme Bulunamadı</p>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          Aradığınız kriterlere uygun bir işletme bulunamadı. Lütfen filtreleri kontrol edin.
                        </p>
                      </div>
                      <button 
                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                        className="mt-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 text-indigo-600 flex items-center justify-center text-xl font-black shadow-sm group-hover:border-indigo-200 group-hover:shadow-indigo-100 transition-all duration-500">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{w.name}</p>
                          <p className="text-[10px] text-slate-400 font-black mt-1 tracking-widest uppercase italic bg-slate-50 w-fit px-1.5 py-0.5 rounded">/{w.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {w.sector || 'Belirtilmedi'}
                      </span>
                    </td>
                    <td className="px-8 py-6">{getStatusBadge(w.status)}</td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-slate-800">{w.primary_contact_name || '-'}</p>
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {w.primary_contact_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {w.plan || 'STANDART'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => navigate(`/platform/workspaces/${w.id}`)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-indigo-100 rounded-xl transition-all" 
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusChangeClick(w)}
                          className={`w-10 h-10 flex items-center justify-center border shadow-sm rounded-xl transition-all ${
                            w.status === 'suspended' 
                              ? 'text-emerald-500 bg-white border-emerald-100 hover:bg-emerald-50 hover:shadow-emerald-100' 
                              : 'text-rose-400 bg-white border-slate-100 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:shadow-rose-100'
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
