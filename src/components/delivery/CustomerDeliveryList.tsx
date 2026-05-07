import { useState, useEffect } from 'react';
import { Truck, Calendar, ChevronRight, Clock } from 'lucide-react';
import { deliveryServiceApi, type DeliveryService } from '../../services/deliveryServiceApi';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { DeliveryTypeBadge } from './DeliveryTypeBadge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LoadingState } from '../ui/States';

export function CustomerDeliveryList({ customerId, onSelect }: { customerId: number, onSelect: (id: number) => void }) {
  const [items, setItems] = useState<DeliveryService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await deliveryServiceApi.list({ customer_id: customerId });
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
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DeliveryTypeBadge type={item.type} />
                  <p className="text-sm font-bold text-text-high group-hover:text-primary transition-colors">{item.title}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-text-body uppercase opacity-60">
                   <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(item.scheduled_at), 'd MMM yyyy', { locale: tr })}</span>
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(item.scheduled_at), 'HH:mm')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DeliveryStatusBadge status={item.status} />
              <ChevronRight className="w-4 h-4 text-border group-hover:text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
