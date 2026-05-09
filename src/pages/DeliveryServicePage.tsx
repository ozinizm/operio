import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog, useConfirm } from '../components/ui/ConfirmDialog';
import {
  Truck, Search, Plus, Filter, Calendar,
  MapPin, User, Eye, Edit2, CheckCircle2,
  Clock, XCircle, Trash2
} from 'lucide-react';
import { deliveryServiceApi, type DeliveryService } from '../services/deliveryServiceApi';
import { DeliveryStatusBadge } from '../components/delivery/DeliveryStatusBadge';
import { DeliveryTypeBadge } from '../components/delivery/DeliveryTypeBadge';
import { DeliveryServiceModal } from '../components/delivery/DeliveryServiceModal';
import { DeliveryServiceDetailDrawer } from '../components/delivery/DeliveryServiceDetailDrawer';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatDateTime } from '../utils/formatters';
import { useToast } from '../components/ui/Toast';

export default function DeliveryServicePage() {
  const [items, setItems] = useState<DeliveryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryService | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Postpone modal state
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [postponeItem, setPostponeItem] = useState<DeliveryService | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({ status: '', type: '', search: '' });

  useEffect(() => {
    fetchItems();

    const handleResourceCreated = (e: any) => {
      if (e.detail?.type === 'delivery_service') {
        fetchItems();
      }
    };

    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, [filters.status, filters.type]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await deliveryServiceApi.list({
        status: filters.status || undefined,
        type: filters.type || undefined
      });
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setIsDrawerOpen(true);
  };

  const handleEdit = (item: DeliveryService) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleComplete = (item: DeliveryService) => {
    confirm({
      title: 'Tamamlandı Olarak İşaretle',
      description: `"${item.title}" kaydı tamamlandı olarak işaretlensin mi?`,
      confirmLabel: 'Tamamlandı Yap',
      cancelLabel: 'Vazgeç',
      variant: 'default',
      onConfirm: async () => {
        try {
          await deliveryServiceApi.complete(item.id);
          showToast('Kayıt tamamlandı olarak işaretlendi.', 'success');
          fetchItems();
        } catch {
          showToast('İşlem başarısız.', 'error');
        }
      },
    });
  };

  const openPostpone = (item: DeliveryService) => {
    setPostponeItem(item);
    setPostponeDate('');
    setPostponeReason('');
    setIsPostponeModalOpen(true);
  };

  const handlePostpone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postponeItem || !postponeDate) return;
    setIsSubmitting(true);
    try {
      await deliveryServiceApi.postpone(postponeItem.id, postponeDate, postponeReason);
      showToast('Kayıt ertelendi.', 'success');
      setIsPostponeModalOpen(false);
      fetchItems();
    } catch {
      showToast('Erteleme başarısız.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (item: DeliveryService) => {
    confirm({
      title: 'Kaydı İptal Et',
      description: `"${item.title}" iptal edilecek. Devam etmek istiyor musunuz?`,
      confirmLabel: 'İptal Et',
      cancelLabel: 'Vazgeç',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await deliveryServiceApi.cancel(item.id);
          showToast('Kayıt iptal edildi.', 'success');
          fetchItems();
        } catch {
          showToast('İptal işlemi başarısız.', 'error');
        }
      },
    });
  };

  const handleDelete = (item: DeliveryService) => {
    confirm({
      title: 'Kaydı Sil',
      description: `"${item.title}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deliveryServiceApi.delete(item.id);
          showToast('Kayıt silindi.', 'success');
          fetchItems();
        } catch {
          showToast('Silme başarısız.', 'error');
        }
      },
    });
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    item.customer_name?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const fieldClass = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelClass = 'block text-xs font-bold text-text-body uppercase opacity-70 mb-1.5';

  return (
    <>
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Teslimat / Servis</h1>
          <p className="text-text-body mt-1">Lojistik süreçleri, araç görevleri ve saha servislerini yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchItems}><Filter className="w-4 h-4 mr-2" /> Yenile</Button>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Yeni Planlama</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="h-fit">
          <CardHeader title="Filtrele" />
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-body uppercase opacity-60">Durum</label>
              <select
                className="w-full px-3 py-2 bg-surface-dim border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tümü</option>
                <option value="planned">Planlandı</option>
                <option value="on_the_way">Yolda</option>
                <option value="in_progress">İşlemde</option>
                <option value="completed">Tamamlandı</option>
                <option value="postponed">Ertelendi</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-body uppercase opacity-60">Tip</label>
              <select
                className="w-full px-3 py-2 bg-surface-dim border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                value={filters.type}
                onChange={e => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Tümü</option>
                <option value="delivery">Teslimat</option>
                <option value="service">Servis</option>
                <option value="installation">Montaj</option>
                <option value="pickup">Toplama</option>
                <option value="inspection">Kontrol</option>
                <option value="maintenance">Bakım</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Main List */}
        <Card className="md:col-span-3" noPadding>
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-jakarta font-bold text-text-high">Günlük Akış</h3>
            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                placeholder="Ara..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10"><LoadingState /></div>
          ) : error ? (
            <div className="p-10"><ErrorState description={error} /></div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center text-text-body italic">Henüz planlanmış bir teslimat veya servis bulunmuyor.</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredItems.map(item => {
                const menuItems: ActionMenuItem[] = [
                  {
                    label: 'Detayı Gör',
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => handleRowClick(item.id),
                  },
                  {
                    label: 'Düzenle',
                    icon: <Edit2 className="w-4 h-4" />,
                    onClick: () => handleEdit(item),
                  },
                  ...(['planned', 'on_the_way', 'in_progress'].includes(item.status) ? [{
                    label: 'Tamamlandı Yap',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    onClick: () => handleComplete(item),
                  }] : []),
                  ...(['planned', 'on_the_way'].includes(item.status) ? [{
                    label: 'Ertele',
                    icon: <Clock className="w-4 h-4" />,
                    onClick: () => openPostpone(item),
                  }] : []),
                  ...(['planned', 'on_the_way', 'in_progress'].includes(item.status) ? [{
                    label: 'İptal Et',
                    icon: <XCircle className="w-4 h-4" />,
                    onClick: () => handleCancel(item),
                    variant: 'danger' as const,
                  }] : []),
                  {
                    label: 'Sil',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDelete(item),
                    variant: 'danger' as const,
                  },
                ];

                return (
                  <div key={item.id} className="p-4 hover:bg-surface-dim/10 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div
                        className="flex items-start gap-4 flex-1 cursor-pointer"
                        onClick={() => handleRowClick(item.id)}
                      >
                        <div className={`p-3 rounded-2xl ${item.status === 'on_the_way' ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-surface-dim text-text-body'}`}>
                          <Truck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <DeliveryTypeBadge type={item.type} />
                            <h4 className="font-bold text-text-high group-hover:text-primary transition-colors">{item.title}</h4>
                          </div>
                          <p className="text-xs text-text-body font-bold text-primary mt-1">{item.customer_name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-bold text-text-body flex items-center gap-1.5 opacity-60 uppercase">
                              <MapPin className="w-3.5 h-3.5" /> {item.address?.substring(0, 30) || 'Adres Belirtilmemiş'}{(item.address?.length ?? 0) > 30 ? '...' : ''}
                            </span>
                            <span className="text-[10px] font-bold text-text-body flex items-center gap-1.5 opacity-60 uppercase">
                              <User className="w-3.5 h-3.5" /> {item.assigned_user_name || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <DeliveryStatusBadge status={item.status} />
                          <p className="text-[10px] text-text-body mt-1.5 font-bold flex items-center gap-1.5 sm:justify-end opacity-60 uppercase">
                            <Calendar className="w-3.5 h-3.5" /> {formatDateTime(item.scheduled_at)}
                          </p>
                        </div>
                        <ActionMenu items={menuItems} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <DeliveryServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchItems}
        initialData={editingItem}
      />

      <DeliveryServiceDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        deliveryId={selectedId}
        onUpdate={fetchItems}
        onEdit={handleEdit}
      />
    </div>

    {/* Postpone Modal */}
    <Modal isOpen={isPostponeModalOpen} onClose={() => setIsPostponeModalOpen(false)} title="Ertele" size="sm">
      <form onSubmit={handlePostpone} className="space-y-4">
        <p className="text-sm text-text-body">
          <span className="font-bold text-text-high">"{postponeItem?.title}"</span> için yeni tarih belirleyin:
        </p>
        <div>
          <label className={labelClass}>Yeni Tarih *</label>
          <input
            className={fieldClass}
            type="datetime-local"
            value={postponeDate}
            onChange={e => setPostponeDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Erteleme Sebebi</label>
          <input
            className={fieldClass}
            value={postponeReason}
            onChange={e => setPostponeReason(e.target.value)}
            placeholder="Opsiyonel"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPostponeModalOpen(false)}>İptal</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor...' : 'Ertele'}</Button>
        </div>
      </form>
    </Modal>
    <ConfirmDialog {...confirmProps} />
    </>
  );
}
