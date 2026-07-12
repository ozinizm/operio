import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../components/ui/useConfirm';
import { GlobalQuickCreateModal, type QuickCreateType } from '../components/shared/GlobalQuickCreateModal';
import {
  Search, Plus, Filter, FileText, ArrowRight,
  Loader2, Edit2, Trash2, Briefcase
} from 'lucide-react';
import { offersApi } from '../services/offersApi';
import { customersApi } from '../services/customersApi';
import { useToast } from '../components/ui/ToastContext';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatCurrency, formatDate } from '../utils/formatters';
import { OFFER_STATUS_MAP } from '../utils/statusMaps';
import { getErrorMessage } from '../services/apiClient';
import type { Customer, Offer, OfferEditForm, ResourceCreatedEvent } from '../types/domain';

const emptyEditForm: OfferEditForm = {
  title: '', amount: '', status: 'draft', description: '', valid_until: '', customer_id: '',
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [quickCreateType, setQuickCreateType] = useState<QuickCreateType>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<OfferEditForm>(emptyEditForm);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { confirmProps, confirm } = useConfirm();

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await offersApi.list();
      setOffers(data);
      setError(null);
    } catch {
      setError('Teklifler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([offersApi.list(), customersApi.list()]).then(([offerData, customerData]) => {
      setOffers(offerData);
      setCustomers(customerData);
      setError(null);
    }).catch(() => {
      setError('Teklifler yüklenirken bir hata oluştu.');
    }).finally(() => {
      setLoading(false);
    });

    const handleResourceCreated = (event: Event) => {
      const e = event as ResourceCreatedEvent;
      if (e.detail?.type === 'offer') {
        void offersApi.list().then(setOffers).catch(() => {
          setError('Teklifler yüklenirken bir hata oluştu.');
        });
      }
    };
    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, []);

  const handleConvertToJob = (offer: Offer) => {
    confirm({
      title: 'Teklifi İşe Dönüştür',
      description: `"${offer.title}" teklifinden yeni bir iş/sipariş kaydı oluşturulacak. Devam etmek istiyor musunuz?`,
      confirmLabel: 'Evet, Dönüştür',
      cancelLabel: 'Vazgeç',
      variant: 'default',
      onConfirm: async () => {
        try {
          setConvertingId(offer.id);
          const result = await offersApi.convertToJob(offer.id);
          showToast('Teklif başarıyla işe dönüştürüldü.', 'success');
          navigate(`/jobs/${result.job_id}`);
        } catch {
          showToast('İşe dönüştürme sırasında bir hata oluştu.', 'error');
        } finally {
          setConvertingId(null);
        }
      },
    });
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setEditForm({
      title: offer.title,
      amount: String(offer.amount || ''),
      status: offer.status,
      description: offer.description || '',
      valid_until: offer.valid_until ? offer.valid_until.split('T')[0] : '',
      customer_id: offer.customer_id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const amountVal = typeof editForm.amount === 'string' 
        ? parseFloat(editForm.amount.replace(',', '.')) 
        : editForm.amount;
        
      if (!editingOffer) return;
      await offersApi.update(editingOffer.id, {
        ...editForm,
        amount: amountVal,
      });
      showToast('Teklif güncellendi.', 'success');
      setIsEditModalOpen(false);
      fetchOffers();
    } catch {
      showToast('Güncelleme başarısız.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (offer: Offer) => {
    confirm({
      title: 'Teklifi Sil',
      description: `"${offer.title}" teklifi kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await offersApi.delete(offer.id);
          showToast('Teklif silindi.', 'success');
          fetchOffers();
        } catch (err: unknown) {
          showToast(getErrorMessage(err) || 'Silme işlemi başarısız.', 'error');
        }
      },
    });
  };

  if (loading) return <LoadingState message="Teklifler yükleniyor..." />;
  if (error) return <ErrorState description={error} onRetry={fetchOffers} />;

  const fieldClass = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelClass = 'block text-xs font-bold text-text-body uppercase opacity-70 mb-1.5';

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Teklifler</h1>
          <p className="text-text-body mt-1">Müşterilerinize sunduğunuz teklifleri takip edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filtrele</Button>
          <Button onClick={() => setQuickCreateType('offer')}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Teklif
          </Button>
        </div>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="max-w-md w-full">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Müşteri veya teklif adı ara..." />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-dim/30 text-xs uppercase text-text-body font-jakarta">
              <tr>
                <th className="px-6 py-4 font-semibold">Teklif Bilgisi</th>
                <th className="px-6 py-4 font-semibold">Müşteri</th>
                <th className="px-6 py-4 font-semibold">Tutar</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
                <th className="px-6 py-4 font-semibold">Geçerlilik</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-body">Henüz teklif bulunmuyor.</td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const menuItems: ActionMenuItem[] = [
                    {
                      label: 'Düzenle',
                      icon: <Edit2 className="w-4 h-4" />,
                      onClick: () => openEdit(offer),
                    },
                    ...(offer.status?.toLowerCase() === 'approved' && !offer.converted_job_id ? [{
                      label: 'Teklifi İşe Dönüştür',
                      icon: <Briefcase className="w-4 h-4" />,
                      onClick: () => handleConvertToJob(offer),
                    }] : []),
                    ...(offer.converted_job_id ? [{
                      label: 'İlgili İşe Git',
                      icon: <ArrowRight className="w-4 h-4" />,
                      onClick: () => navigate(`/jobs/${offer.converted_job_id}`),
                    }] : []),
                    {
                      label: 'Sil',
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: () => handleDelete(offer),
                      variant: 'danger' as const,
                    },
                  ];
                  return (
                    <tr key={offer.id} className="hover:bg-surface-dim/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                          <div>
                            <div className="font-bold text-text-high">{offer.title}</div>
                            <div className="text-xs text-text-body">{offer.offer_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-high font-medium">{offer.customer?.name || 'Belirtilmemiş'}</td>
                      <td className="px-6 py-4 text-text-high font-bold">{formatCurrency(offer.amount)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={OFFER_STATUS_MAP[offer.status]?.variant || 'default'}>
                          {OFFER_STATUS_MAP[offer.status]?.label || offer.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-body">{offer.valid_until ? formatDate(offer.valid_until) : '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {offer.status?.toLowerCase() === 'approved' && !offer.converted_job_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => handleConvertToJob(offer)}
                              disabled={convertingId === offer.id}
                            >
                              {convertingId === offer.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <ArrowRight className="w-3 h-3 mr-1" />
                              )}
                              Teklifi İşe Dönüştür
                            </Button>
                          )}
                          {offer.converted_job_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600"
                              onClick={() => navigate(`/jobs/${offer.converted_job_id}`)}
                            >
                              İşe Git
                            </Button>
                          )}
                          <ActionMenu items={menuItems} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {offers.map((offer) => (
            <div key={offer.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                  <div>
                    <div className="font-bold text-text-high text-sm">{offer.title}</div>
                    <div className="text-xs text-text-body">{offer.customer?.name}</div>
                  </div>
                </div>
                <ActionMenu items={[
                  { label: 'Düzenle', icon: <Edit2 className="w-4 h-4" />, onClick: () => openEdit(offer) },
                  ...(offer.status?.toLowerCase() === 'approved' && !offer.converted_job_id ? [{ 
                    label: 'Teklifi İşe Dönüştür', 
                    icon: <Briefcase className="w-4 h-4" />, 
                    onClick: () => handleConvertToJob(offer) 
                  }] : []),
                  { label: 'Sil', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(offer), variant: 'danger' as const },
                ]} />
              </div>
              <div className="flex justify-between items-center">
                <Badge variant={OFFER_STATUS_MAP[offer.status]?.variant || 'default'}>
                  {OFFER_STATUS_MAP[offer.status]?.label || offer.status}
                </Badge>
                <span className="font-bold text-sm text-text-high">{formatCurrency(offer.amount)}</span>
              </div>
              <div className="text-xs text-text-body">Geçerlilik: {offer.valid_until ? formatDate(offer.valid_until) : '—'}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Edit Modal */}
    <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Teklifi Düzenle" size="md">
      <form onSubmit={handleSaveEdit} className="space-y-4">
        <div>
          <label className={labelClass}>Başlık</label>
          <input className={fieldClass} value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Müşteri</label>
          <select className={fieldClass} value={editForm.customer_id} onChange={e => setEditForm(p => ({ ...p, customer_id: e.target.value }))}>
            <option value="">Müşteri Seçin</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tutar (₺)</label>
            <input className={fieldClass} type="number" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Durum</label>
            <select className={fieldClass} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
              <option value="draft">Taslak</option>
              <option value="sent">Gönderildi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="expired">Süresi Doldu</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Geçerlilik Tarihi</label>
          <input className={fieldClass} type="date" value={editForm.valid_until} onChange={e => setEditForm(p => ({ ...p, valid_until: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Açıklama</label>
          <textarea className={`${fieldClass} h-16 resize-none`} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
          <Button type="submit" className="flex-1" disabled={isSaving}>{isSaving ? 'Kaydediliyor...' : 'Güncelle'}</Button>
        </div>
      </form>
    </Modal>

    {/* Quick Create */}
    <GlobalQuickCreateModal 
      type={quickCreateType} 
      onClose={() => setQuickCreateType(null)} 
      onSuccess={fetchOffers}
    />
    <ConfirmDialog {...confirmProps} />
    </>
  );
}
