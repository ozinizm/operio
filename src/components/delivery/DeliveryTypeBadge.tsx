// Removed unused import: import { Badge } from '../ui/Badge';

export function DeliveryTypeBadge({ type }: { type: string }) {
  const configs: Record<string, { label: string }> = {
    delivery: { label: 'Teslimat' },
    service: { label: 'Servis' },
    installation: { label: 'Montaj' },
    pickup: { label: 'Toplama' },
    inspection: { label: 'Kontrol' },
    maintenance: { label: 'Bakım' },
  };

  const config = configs[type] || { label: type };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-dim text-text-body border border-border uppercase tracking-wider">
      {config.label}
    </span>
  );
}
