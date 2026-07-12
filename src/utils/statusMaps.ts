import type { BadgeVariant } from '../components/ui/Badge';

export interface StatusDisplay {
  label: string;
  variant: BadgeVariant;
}

export const JOB_STATUS_MAP: Record<string, StatusDisplay> = {
  'new': { label: 'Yeni', variant: 'info' },
  'planned': { label: 'Planlandı', variant: 'default' },
  'in_progress': { label: 'İşlemde', variant: 'warning' },
  'completed': { label: 'Tamamlandı', variant: 'success' },
  'delivered': { label: 'Teslim Edildi', variant: 'success' },
  'cancelled': { label: 'İptal', variant: 'error' },
};

export const OFFER_STATUS_MAP: Record<string, StatusDisplay> = {
  'draft': { label: 'Taslak', variant: 'default' },
  'sent': { label: 'Gönderildi', variant: 'info' },
  'approved': { label: 'Onaylandı', variant: 'success' },
  'rejected': { label: 'Reddedildi', variant: 'error' },
  'expired': { label: 'Süresi Doldu', variant: 'warning' },
};

export const TASK_STATUS_MAP: Record<string, StatusDisplay> = {
  'todo': { label: 'Yapılacak', variant: 'default' },
  'in_progress': { label: 'İşlemde', variant: 'warning' },
  'review': { label: 'İncelemede', variant: 'info' },
  'completed': { label: 'Tamamlandı', variant: 'success' },
  'overdue': { label: 'Gecikti', variant: 'error' },
};

export const FINANCE_STATUS_MAP: Record<string, StatusDisplay> = {
  'pending': { label: 'Bekliyor', variant: 'warning' },
  'paid': { label: 'Ödendi', variant: 'success' },
  'overdue': { label: 'Gecikmiş', variant: 'error' },
  'cancelled': { label: 'İptal', variant: 'default' },
};

export const DELIVERY_STATUS_MAP: Record<string, StatusDisplay> = {
  'planned': { label: 'Planlandı', variant: 'default' },
  'in_progress': { label: 'Yolda / İşlemde', variant: 'warning' },
  'completed': { label: 'Tamamlandı', variant: 'success' },
  'postponed': { label: 'Ertelendi', variant: 'info' },
  'cancelled': { label: 'İptal', variant: 'error' },
};

export const TICKET_STATUS_MAP: Record<string, StatusDisplay> = {
  'new': { label: 'Yeni', variant: 'info' },
  'reviewing': { label: 'İncelemede', variant: 'default' },
  'in_progress': { label: 'İşlemde', variant: 'warning' },
  'waiting_customer': { label: 'Müşteri Bekleniyor', variant: 'info' },
  'resolved': { label: 'Çözüldü', variant: 'success' },
  'closed': { label: 'Kapalı', variant: 'default' },
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Düşük', normal: 'Normal', medium: 'Orta', high: 'Yüksek', critical: 'Kritik',
};
export const JOB_TYPE_LABELS: Record<string, string> = {
  general: 'Genel', order: 'Sipariş', service: 'Servis', project: 'Proje',
};
export const ROLE_LABELS: Record<string, string> = {
  owner: 'Kurucu', admin: 'Admin', manager: 'Yönetici', staff: 'Personel', personnel: 'Personel',
};
export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', passive: 'Pasif', prospect: 'Potansiyel',
};
export const enumLabel = (value: string | null | undefined, labels: Record<string, string>) =>
  value ? (labels[value] || value) : '—';
