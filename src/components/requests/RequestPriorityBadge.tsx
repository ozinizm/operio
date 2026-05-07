import { Badge } from '../ui/Badge';

export function RequestPriorityBadge({ priority }: { priority: string }) {
  const configs: Record<string, { label: string; variant: any }> = {
    low: { label: 'Düşük', variant: 'secondary' },
    normal: { label: 'Normal', variant: 'info' },
    high: { label: 'Yüksek', variant: 'warning' },
    critical: { label: 'Kritik', variant: 'error' },
  };

  const config = configs[priority] || { label: priority, variant: 'secondary' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
