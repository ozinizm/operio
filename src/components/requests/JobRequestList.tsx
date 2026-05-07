import { useState, useEffect } from 'react';
import { AlertCircle, Calendar, ChevronRight, MessageSquare, Plus } from 'lucide-react';
import { requestsApi, type RequestTicket } from '../../services/requestsApi';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LoadingState } from '../ui/States';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

export function JobRequestList({ jobId, customerId: _customerId, onSelect, onCreate }: { jobId: number, customerId: number, onSelect: (id: number) => void, onCreate: () => void }) {
  const [items, setItems] = useState<RequestTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await requestsApi.list({ job_id: jobId });
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [jobId]);

  return (
    <Card noPadding>
      <CardHeader 
        title="Şikayet & Revizyonlar" 
        action={<Button variant="ghost" size="sm" onClick={onCreate}><Plus className="w-4 h-4" /></Button>} 
      />
      {loading ? (
        <div className="p-10"><LoadingState /></div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-text-body italic">Bu işe bağlı talep kaydı bulunmuyor.</div>
      ) : (
        <div className="divide-y divide-border">
          {items.map(item => (
            <div key={item.id} className="p-4 hover:bg-surface-dim/20 transition-colors cursor-pointer group" onClick={() => onSelect(item.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-dim rounded-lg text-text-body">
                    {item.type === 'complaint' ? <AlertCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-text-high group-hover:text-primary transition-colors">{item.title}</p>
                      <RequestPriorityBadge priority={item.priority} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-text-body uppercase opacity-60">
                       <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(item.created_at), 'd MMM yyyy', { locale: tr })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <RequestStatusBadge status={item.status} />
                  <ChevronRight className="w-4 h-4 text-border group-hover:text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
