import { useState, useEffect } from 'react';
import { AlertCircle, Calendar, ChevronRight, MessageSquare } from 'lucide-react';
import { requestsApi, type RequestTicket } from '../../services/requestsApi';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LoadingState } from '../ui/States';

export function CustomerRequestList({ customerId, onSelect }: { customerId: number, onSelect: (id: number) => void }) {
  const [items, setItems] = useState<RequestTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await requestsApi.list({ customer_id: customerId });
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [customerId]);

  if (loading) return <LoadingState />;
  if (items.length === 0) return <div className="p-10 text-center text-text-body italic border border-dashed border-border rounded-xl">Kayıt bulunamadı.</div>;

  return (
    <div className="divide-y divide-border -mx-6 -mb-6">
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
                   <span>Kaynak: {item.source}</span>
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
  );
}
