import { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar,
  User, Globe, Zap, Loader2
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PlatformAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await platformApi.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4" /> System Surveillance
        </div>
        <h1 className="text-4xl font-jakarta font-extrabold text-slate-800 tracking-tight">Aktivite Kayıtları</h1>
        <p className="text-slate-500 font-medium">Platform genelindeki kritik işlemlerin ve değişikliklerin gerçek zamanlı dökümü.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="İşlem veya kullanıcı ile ara..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Son 30 Gün</span>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-all">
              <Filter className="w-4 h-4" />
              Gelişmiş Filtre
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Zaman Damgası</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Eylem</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Açıklama / Detay</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Aktör</th>
                <th className="px-8 py-5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-right">Hedef İşletme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">Kayıt bulunamadı.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <p className="text-sm text-slate-800 font-bold">{format(new Date(log.created_at), 'dd MMM yyyy', { locale: tr })}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                        log.action.includes('create') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        log.action.includes('delete') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        log.action.includes('status') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {log.action.replace('.', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-700 font-bold max-w-md truncate">{log.description}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                           <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-600" title={`ID: ${log.actor_user_id}`}>{log.actor_email || `User #${log.actor_user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl w-fit ml-auto shadow-sm">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-bold text-[11px] text-slate-600">ID: {log.workspace_id || 'SYSTEM'}</span>
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
