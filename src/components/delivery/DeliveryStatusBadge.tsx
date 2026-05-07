import { Badge } from '../ui/Badge';
import { DELIVERY_STATUS_MAP } from '../../utils/statusMaps';

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = DELIVERY_STATUS_MAP[status] || { label: status, variant: 'default' };
  
  return (
    <Badge variant={config.variant as any}>
      {config.label}
    </Badge>
  );
}
