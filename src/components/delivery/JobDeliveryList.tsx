import { useState, useEffect } from 'react';
import { Truck, Calendar, ChevronRight, Plus } from 'lucide-react';
import { deliveryServiceApi, type DeliveryService } from '../../services/deliveryServiceApi';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { DeliveryTypeBadge } from './DeliveryTypeBadge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LoadingState } from '../ui/States';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';

export function JobDeliveryList({ jobId, onSelect, onCreate }: { jobId: number, customerId: number, onSelect: (id: number) => void, onCreate: () => void }) {
  const [items, setItems] = useState<DeliveryService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await deliveryServiceApi.list({ job_id: jobId });
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
        title="Lojistik & Teslimat" 
        action={<Button variant="ghost" size="sm" onClick={onCreate}><Plus className="w-4 h-4" /></Button>} 
      />
      {loading ? (
        <div className="p-10"><LoadingState /></div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-text-body italic">Bu işe bağlı teslimat kaydı bulunmuyor.</div>
      ) : (
        <div className="divide-y divide-border">
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
      )}
    </Card>
  );
}
