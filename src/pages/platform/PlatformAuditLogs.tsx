import { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar,
  User, Globe
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-jakarta font-bold text-text-high">Aktivite Kayıtları</h1>
        <p className="text-text-medium">Platform genelindeki kritik işlemlerin dökümü.</p>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-medium" />
            <input 
              type="text" 
              placeholder="İşlem veya kullanıcı ile ara..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-medium" />
              <span className="text-sm text-text-medium">Son 30 Gün</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm hover:bg-gray-100 transition-colors">
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50/30">
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Tarih</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">İşlem</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Detay</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high">Kullanıcı</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-high text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text-medium">Yükleniyor...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-text-medium">Kayıt bulunamadı.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-text-high">{format(new Date(log.created_at), 'dd MMM yyyy', { locale: tr })}</p>
                      <p className="text-xs text-text-medium">{format(new Date(log.created_at), 'HH:mm')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.action.includes('create') ? 'bg-green-100 text-green-700' :
                        log.action.includes('delete') ? 'bg-red-100 text-red-700' :
                        log.action.includes('status') ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action.replace('.', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-high font-medium">{log.description}</td>
                    <td className="px-6 py-4 text-sm text-text-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span title={`ID: ${log.actor_user_id}`}>{log.actor_email || `Kullanıcı #${log.actor_user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-medium text-right">
                      <div className="flex items-center justify-end gap-1.5 bg-gray-100 px-2 py-1 rounded-lg w-fit ml-auto">
                        <Globe className="w-3 h-3 text-gray-500" />
                        <span className="font-mono text-[11px]">WID: {log.workspace_id || 'Global'}</span>
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
