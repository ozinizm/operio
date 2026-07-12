import { Badge } from '../ui/Badge';
import { TICKET_STATUS_MAP } from '../../utils/statusMaps';

export function RequestStatusBadge({ status }: { status: string }) {
  const config = TICKET_STATUS_MAP[status] || { label: status, variant: 'default' };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
