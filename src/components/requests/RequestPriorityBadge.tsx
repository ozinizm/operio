import { Badge, type BadgeVariant } from '../ui/Badge';

export function RequestPriorityBadge({ priority }: { priority: string }) {
  const configs: Record<string, { label: string; variant: BadgeVariant }> = {
    low: { label: 'Düşük', variant: 'default' },
    normal: { label: 'Normal', variant: 'info' },
    high: { label: 'Yüksek', variant: 'warning' },
    critical: { label: 'Kritik', variant: 'error' },
  };

  const config = configs[priority] || { label: priority, variant: 'default' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
