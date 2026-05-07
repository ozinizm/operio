import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Package, FileText, Phone, MessageSquare, CheckCircle2, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { deliveryServiceApi, type DeliveryService } from '../../services/deliveryServiceApi';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { DeliveryTypeBadge } from './DeliveryTypeBadge';
import { CommentsPanel } from '../collaboration/CommentsPanel';
import { EntityWatchButton } from '../collaboration/EntityWatchButton';
import { useToast } from '../ui/Toast';
import { ConfirmDialog, useConfirm } from '../ui/ConfirmDialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DeliveryServiceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: number | null;
  onUpdate: () => void;
  onEdit: (delivery: DeliveryService) => void;
}

export function DeliveryServiceDetailDrawer({ isOpen, onClose, deliveryId, onUpdate, onEdit }: DeliveryServiceDetailDrawerProps) {
  const [delivery, setDelivery] = useState<DeliveryService | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'files'>('info');
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  useEffect(() => {
    if (isOpen && deliveryId) {
      fetchDelivery();
    }
  }, [isOpen, deliveryId]);

  const fetchDelivery = async () => {
    if (!deliveryId) return;
    try {
      setLoading(true);
      const data = await deliveryServiceApi.get(deliveryId);
      setDelivery(data);
    } catch (err) {
      showToast('Detaylar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action: 'complete' | 'cancel') => {
    if (!delivery) return;
    const isComplete = action === 'complete';
    confirm({
      title: isComplete ? 'Tamamlandı İşaretle' : 'Kayıdı İptal Et',
      description: isComplete
        ? `"${delivery.title}" tamamlandı olarak işaretlensin mi?`
        : `"${delivery.title}" iptal edilecek. Devam edilsin mi?`,
      confirmLabel: isComplete ? 'Tamamlandı Yap' : 'İptal Et',
      cancelLabel: 'Vazgeç',
      variant: isComplete ? 'default' : 'warning',
      onConfirm: async () => {
        try {
          if (isComplete) {
            await deliveryServiceApi.complete(delivery.id);
            showToast('İşlem tamamlandı', 'success');
          } else {
            await deliveryServiceApi.cancel(delivery.id);
            showToast('İşlem iptal edildi', 'success');
          }
          fetchDelivery();
          onUpdate();
        } catch {
          showToast('İşlem başarısız', 'error');
        }
      },
    });
  };

  const handleDelete = () => {
    if (!delivery) return;
    confirm({
      title: 'Kaydı Sil',
      description: `"${delivery.title}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deliveryServiceApi.delete(delivery.id);
          showToast('Kayıt silindi', 'success');
          onUpdate();
          onClose();
        } catch {
          showToast('Silme başarısız', 'error');
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 z-[110] w-full sm:w-[500px] bg-surface shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
      <div className="p-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-surface-dim rounded-xl transition-colors">
            <X className="w-5 h-5 text-text-body" />
          </button>
          <h2 className="font-jakarta font-bold text-text-high">İşlem Detayı</h2>
        </div>
        <div className="flex items-center gap-2">
          {delivery && (
            <>
              <EntityWatchButton entityType="delivery_service" entityId={delivery.id} />
              <button onClick={() => onEdit(delivery)} className="p-2 hover:bg-surface-dim rounded-xl text-text-body transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center italic text-text-body">Yükleniyor...</div>
      ) : delivery ? (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <DeliveryTypeBadge type={delivery.type} />
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <h1 className="text-xl font-jakarta font-bold text-text-high leading-tight">{delivery.title}</h1>
              <div className="flex items-center gap-4 text-xs font-bold text-text-body">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {format(new Date(delivery.scheduled_at), 'd MMMM yyyy', { locale: tr })}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {format(new Date(delivery.scheduled_at), 'HH:mm')}</span>
              </div>
            </div>

            {/* Quick Actions */}
            {delivery.status !== 'completed' && delivery.status !== 'cancelled' && (
              <div className="grid grid-cols-2 gap-3">
                <Button className="w-full bg-success hover:bg-success/90" onClick={() => handleStatusUpdate('complete')}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Tamamlandı
                </Button>
                <Button variant="outline" className="w-full border-error text-error hover:bg-error/5" onClick={() => handleStatusUpdate('cancel')}>
                  <X className="w-4 h-4 mr-2" /> İptal Et
                </Button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'info', label: 'Bilgiler', icon: FileText },
                { id: 'comments', label: 'Yorumlar', icon: MessageSquare },
                { id: 'files', label: 'Dosyalar', icon: Package },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-body hover:text-text-high'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Info Cards */}
                <div className="space-y-4">
                  <div className="p-4 bg-surface-dim rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-body uppercase opacity-60">Müşteri</span>
                      <span className="text-xs font-bold text-primary">{delivery.customer_name}</span>
                    </div>
                    {delivery.job_title && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-body uppercase opacity-60">İlgili İş</span>
                        <span className="text-xs font-bold text-text-high">{delivery.job_title}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-body uppercase opacity-60">Sorumlu / Saha</span>
                      <span className="text-xs font-bold text-text-high">{delivery.assigned_user_name || 'Atanmamış'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-dim rounded-2xl space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-body uppercase opacity-60">
                        <MapPin className="w-3.5 h-3.5" /> Adres
                      </div>
                      <p className="text-xs text-text-high leading-relaxed">{delivery.address || 'Adres belirtilmemiş.'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-body uppercase opacity-60">
                          <User className="w-3.5 h-3.5" /> İletişim Kişisi
                        </div>
                        <p className="text-xs text-text-high">{delivery.contact_person || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-body uppercase opacity-60">
                          <Phone className="w-3.5 h-3.5" /> Telefon
                        </div>
                        <p className="text-xs text-text-high">{delivery.contact_phone || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {delivery.notes && (
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase mb-2">
                        <AlertCircle className="w-3.5 h-3.5" /> Notlar
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{delivery.notes}</p>
                    </div>
                  )}

                  {delivery.result_note && (
                    <div className="p-4 bg-success/5 rounded-2xl border border-success/20">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-success uppercase mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sonuç Notu
                      </div>
                      <p className="text-xs text-text-high leading-relaxed">{delivery.result_note}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="animate-in fade-in duration-200">
                <CommentsPanel entityType="delivery_service" entityId={delivery.id} />
              </div>
            )}

            {activeTab === 'files' && (
              <div className="animate-in fade-in duration-200 text-center py-10 italic text-text-body text-sm">
                Dosya yönetimi yakında eklenecek.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-body italic">Kayıt bulunamadı.</div>
      )}
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
