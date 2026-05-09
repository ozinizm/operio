import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog, useConfirm } from '../components/ui/ConfirmDialog';
import {
  AlertCircle, Search, Plus, Filter, MessageSquare,
  User, Headphones, Clock,
  Eye, Edit2, CheckCircle2, XCircle, Trash2, RefreshCw
} from 'lucide-react';
import { requestsApi, type RequestTicket } from '../services/requestsApi';
import { RequestStatusBadge } from '../components/requests/RequestStatusBadge';
import { RequestPriorityBadge } from '../components/requests/RequestPriorityBadge';
import { RequestTicketModal } from '../components/requests/RequestTicketModal';
import { RequestTicketDetailDrawer } from '../components/requests/RequestTicketDetailDrawer';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/ui/Toast';

export default function ComplaintsPage() {
  const [items, setItems] = useState<RequestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestTicket | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Resolve modal state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingItem, setResolvingItem] = useState<RequestTicket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '' });

  useEffect(() => {
    fetchItems();

    const handleResourceCreated = (e: any) => {
      if (e.detail?.type === 'request_ticket') {
        fetchItems();
      }
    };

    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, [filters.status, filters.priority, filters.type]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await requestsApi.list({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
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

  const handleEdit = (item: RequestTicket) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openResolve = (item: RequestTicket) => {
    setResolvingItem(item);
    setResolutionNote('');
    setIsResolveModalOpen(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;
    setIsSubmitting(true);
    try {
      await requestsApi.resolve(resolvingItem.id, resolutionNote);
      showToast('Talep çözüldü olarak işaretlendi.', 'success');
      setIsResolveModalOpen(false);
      fetchItems();
    } catch {
      showToast('İşlem başarısız.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (item: RequestTicket) => {
    confirm({
      title: 'Talebi Kapat',
      description: `"${item.title}" talebi kapatılacak. Durum 'Kapalı' olarak işaretlenecek.`,
      confirmLabel: 'Kapat',
      cancelLabel: 'Vazgeç',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await requestsApi.close(item.id);
          showToast('Talep kapatıldı.', 'success');
          fetchItems();
        } catch {
          showToast('Kapatma işlemi başarısız.', 'error');
        }
      },
    });
  };

  const handleReopen = async (item: RequestTicket) => {
    try {
      await requestsApi.reopen(item.id);
      showToast('Talep yeniden açıldı.', 'success');
      fetchItems();
    } catch {
      showToast('Yeniden açma başarısız.', 'error');
    }
  };

  const handleDelete = (item: RequestTicket) => {
    confirm({
      title: 'Talebi Sil',
      description: `"${item.title}" talebi kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await requestsApi.delete(item.id);
          showToast('Talep silindi.', 'success');
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
    <div className="space-y-6 font-inter text-text-high">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold">Şikayet / Talepler</h1>
          <p className="text-text-body mt-1">Müşteri geri bildirimlerini, şikayetleri ve servis taleplerini takip edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchItems}><Filter className="w-4 h-4 mr-2" /> Yenile</Button>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Yeni Talep</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Card */}
        <Card className="h-fit">
          <CardHeader title="Hızlı Filtre" />
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-body uppercase opacity-60">Durum</label>
              <select
                className="w-full px-3 py-2 bg-surface-dim border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tümü</option>
                <option value="new">Yeni</option>
                <option value="reviewing">İncelemede</option>
                <option value="in_progress">İşlemde</option>
                <option value="waiting_customer">Müşteri Bekleniyor</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapalı</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-body uppercase opacity-60">Öncelik</label>
              <select
                className="w-full px-3 py-2 bg-surface-dim border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                value={filters.priority}
                onChange={e => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">Tümü</option>
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Main List Card */}
        <Card className="md:col-span-3" noPadding>
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-jakarta font-bold">Talep Listesi</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-transparent bg-surface-dim text-text-body">
                {filteredItems.length}
              </span>
            </div>
            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
                placeholder="Konu veya müşteri ara..."
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
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-surface-dim rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-text-body/40" />
              </div>
              <p className="text-text-body italic text-sm">Aranan kriterlere uygun talep bulunamadı.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredItems.map(item => {
                const isActive = !['resolved', 'closed', 'cancelled'].includes(item.status);
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
                  ...(isActive ? [{
                    label: 'Çözüldü Yap',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    onClick: () => openResolve(item),
                  }] : []),
                  ...(isActive ? [{
                    label: 'Kapat',
                    icon: <XCircle className="w-4 h-4" />,
                    onClick: () => handleClose(item),
                    variant: 'danger' as const,
                  }] : []),
                  ...(!isActive ? [{
                    label: 'Yeniden Aç',
                    icon: <RefreshCw className="w-4 h-4" />,
                    onClick: () => handleReopen(item),
                  }] : []),
                  {
                    label: 'Sil',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDelete(item),
                    variant: 'danger' as const,
                  },
                ];

                return (
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-surface-dim/20 transition-all group flex items-start gap-4 ${item.priority === 'critical' ? 'border-l-4 border-error' : ''}`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 cursor-pointer ${item.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-surface-dim text-text-body'}`}
                      onClick={() => handleRowClick(item.id)}
                    >
                      {item.type === 'complaint' ? <AlertCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 space-y-1 cursor-pointer" onClick={() => handleRowClick(item.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                          <RequestPriorityBadge priority={item.priority} />
                        </div>
                        <RequestStatusBadge status={item.status} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] font-bold text-text-body uppercase opacity-60">
                          <span className="text-primary">{item.customer_name}</span>
                          <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5" /> {item.source}</span>
                          {item.assigned_user_name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.assigned_user_name}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-body/60 font-medium italic">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="pl-2 self-center flex-shrink-0">
                      <ActionMenu items={menuItems} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <RequestTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchItems}
        initialData={editingItem}
      />

      <RequestTicketDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        requestId={selectedId}
        onUpdate={fetchItems}
        onEdit={handleEdit}
      />
    </div>

    {/* Resolve Modal */}
    <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Çözüldü Olarak İşaretle" size="sm">
      <form onSubmit={handleResolve} className="space-y-4">
        <p className="text-sm text-text-body">
          <span className="font-bold text-text-high">"{resolvingItem?.title}"</span> talebi için çözüm notunuzu girin:
        </p>
        <div>
          <label className={labelClass}>Çözüm Notu</label>
          <textarea
            className={`${fieldClass} h-24 resize-none`}
            value={resolutionNote}
            onChange={e => setResolutionNote(e.target.value)}
            placeholder="Yapılan işlemi ve çözümü kısaca açıklayın..."
            required
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setIsResolveModalOpen(false)}>İptal</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor...' : 'Çözüldü İşaretle'}</Button>
        </div>
      </form>
    </Modal>
    <ConfirmDialog {...confirmProps} />
    </>
  );
}
