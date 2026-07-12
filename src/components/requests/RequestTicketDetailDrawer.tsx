import { useState, useEffect } from 'react';
import { X, Calendar, Package, FileText, MessageSquare, CheckCircle2, History, Trash2, Edit, Headphones } from 'lucide-react';
import { Button } from '../ui/Button';
import { requestsApi, type RequestTicket } from '../../services/requestsApi';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { CommentsPanel } from '../collaboration/CommentsPanel';
import { EntityWatchButton } from '../collaboration/EntityWatchButton';
import { useToast } from '../ui/ToastContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useConfirm } from '../ui/useConfirm';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface RequestTicketDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  onUpdate: () => void;
  onEdit: (request: RequestTicket) => void;
}

const requestTabs: Array<{ id: 'info' | 'comments' | 'files'; label: string; icon: typeof FileText }> = [
  { id: 'info', label: 'Müşteri Bilgisi', icon: FileText },
  { id: 'comments', label: 'Yorumlar', icon: MessageSquare },
  { id: 'files', label: 'Ekler', icon: Package },
];

export function RequestTicketDetailDrawer({ isOpen, onClose, requestId, onUpdate, onEdit }: RequestTicketDetailDrawerProps) {
  const [request, setRequest] = useState<RequestTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'files'>('info');
  const [resolutionNote, setResolutionNote] = useState('');
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  useEffect(() => {
    if (isOpen && requestId) {
      void requestsApi.get(requestId).then(data => {
        setRequest(data);
        setResolutionNote(data.resolution_note || '');
      }).catch(() => showToast('Detaylar yüklenemedi', 'error'));
    }
  }, [isOpen, requestId, showToast]);

  const fetchRequest = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const data = await requestsApi.get(requestId);
      setRequest(data);
      setResolutionNote(data.resolution_note || '');
    } catch {
      showToast('Detaylar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action: 'resolve' | 'close' | 'reopen') => {
    if (!request) return;
    try {
      if (action === 'resolve') {
        if (!resolutionNote) {
          showToast('Lütfen çözüm notu girin', 'warning');
          return;
        }
        await requestsApi.resolve(request.id, resolutionNote);
        showToast('Talep çözüldü', 'success');
      } else if (action === 'close') {
        await requestsApi.close(request.id);
        showToast('Talep kapatıldı', 'success');
      } else if (action === 'reopen') {
        await requestsApi.reopen(request.id);
        showToast('Talep yeniden açıldı', 'success');
      }
      fetchRequest();
      onUpdate();
    } catch {
      showToast('İşlem başarısız', 'error');
    }
  };

  const handleDelete = () => {
    if (!request) return;
    confirm({
      title: 'Talebi Sil',
      description: `"${request.title}" talebi kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await requestsApi.delete(request.id);
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
          <h2 className="font-jakarta font-bold text-text-high">Talep Detayı</h2>
        </div>
        <div className="flex items-center gap-2">
          {request && (
            <>
              <EntityWatchButton entityType="request_ticket" entityId={request.id} />
              <button onClick={() => onEdit(request)} className="p-2 hover:bg-surface-dim rounded-xl text-text-body transition-colors">
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
      ) : request ? (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <RequestPriorityBadge priority={request.priority} />
                <RequestStatusBadge status={request.status} />
              </div>
              <h1 className="text-xl font-jakarta font-bold text-text-high leading-tight">{request.title}</h1>
              <div className="flex items-center gap-4 text-[10px] font-bold text-text-body uppercase opacity-60">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {format(new Date(request.created_at), 'd MMM yyyy HH:mm', { locale: tr })}</span>
                <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-primary" /> {request.source} üzerinden</span>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-4 bg-surface-dim rounded-2xl border border-border">
               <p className="text-sm text-text-body leading-relaxed whitespace-pre-wrap">{request.description || 'Açıklama belirtilmemiş.'}</p>
            </div>

            {/* Quick Actions */}
            {request.status !== 'resolved' && request.status !== 'closed' && (
               <div className="space-y-4 border-t border-border pt-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-text-body uppercase opacity-60">Çözüm Notu</label>
                   <textarea
                     className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors min-h-[80px]"
                     placeholder="Talebin nasıl çözüldüğünü yazın..."
                     value={resolutionNote}
                     onChange={e => setResolutionNote(e.target.value)}
                   />
                 </div>
                 <div className="flex gap-3">
                   <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => handleStatusUpdate('resolve')}>
                     <CheckCircle2 className="w-4 h-4 mr-2" /> Çözüldü Olarak İşaretle
                   </Button>
                   <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate('close')}>
                     <X className="w-4 h-4 mr-2" /> Kapat
                   </Button>
                 </div>
               </div>
            )}

            {request.status === 'resolved' && (
              <div className="space-y-4 border-t border-border pt-6">
                <div className="p-4 bg-success/5 rounded-2xl border border-success/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-success uppercase mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Çözüm Detayı
                  </div>
                  <p className="text-sm text-text-high leading-relaxed">{request.resolution_note}</p>
                  <p className="text-[10px] text-text-body mt-2 italic">{format(new Date(request.resolved_at!), 'd MMM yyyy HH:mm', { locale: tr })} tarihinde çözüldü.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-primary text-primary" onClick={() => handleStatusUpdate('reopen')}>
                    <History className="w-4 h-4 mr-2" /> Talebi Yeniden Aç
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate('close')}>
                    <X className="w-4 h-4 mr-2" /> Kapat
                  </Button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border">
              {requestTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-body hover:text-text-high'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'info' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 bg-surface-dim rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-body uppercase opacity-60">Müşteri</span>
                    <span className="text-xs font-bold text-primary">{request.customer_name}</span>
                  </div>
                  {request.job_title && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-body uppercase opacity-60">İlgili İş</span>
                      <span className="text-xs font-bold text-text-high">{request.job_title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-body uppercase opacity-60">Sorumlu</span>
                    <span className="text-xs font-bold text-text-high">{request.assigned_user_name || 'Atanmamış'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="animate-in fade-in duration-200">
                <CommentsPanel entityType="request_ticket" entityId={request.id} />
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
