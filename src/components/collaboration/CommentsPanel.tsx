import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { MessageSquare, Send, Trash2, Clock, Reply } from 'lucide-react';
import { commentsApi, type Comment } from '../../services/commentsApi';
import { useAuth } from '../../context/AuthContextValue';
import { useToast } from '../ui/ToastContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useConfirm } from '../ui/useConfirm';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ensureUTC } from '../../utils/formatters';

interface CommentsPanelProps {
  entityType: string;
  entityId: number;
}

export function CommentsPanel({ entityType, entityId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await commentsApi.list(entityType, entityId);
      setComments(data);
    } catch (err) {
      console.error('Comments load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void commentsApi.list(entityType, entityId).then(setComments).catch((err: unknown) => {
      console.error('Comments load failed:', err);
    }).finally(() => setIsLoading(false));
  }, [entityType, entityId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await commentsApi.create({
        entity_type: entityType,
        entity_id: entityId,
        body: newComment.trim()
      });
      setNewComment('');
      void fetchComments();
      showToast('Yorum eklendi.', 'success');
    } catch {
      showToast('Yorum gönderilemedi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: 'Yorumu Sil',
      description: 'Bu yorum kalıcı olarak silinecek.',
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await commentsApi.delete(id);
          setComments(prev => prev.filter(c => c.id !== id));
          showToast('Yorum silindi.', 'success');
        } catch {
          showToast('Yorum silinemedi.', 'error');
        }
      },
    });
  };

  return (
    <Card>
      <CardHeader 
        title="Yorumlar & Notlar" 
        action={<MessageSquare className="w-5 h-5 text-text-body" />} 
      />
      
      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-24 text-text-body italic">
            <p className="text-sm">Henüz yorum yapılmamış.</p>
            <p className="text-[10px] mt-1">İşbirliğini başlatmak için bir şeyler yazın.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group relative">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                  {comment.author_name?.substring(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-high">{comment.author_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-body flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(ensureUTC(comment.created_at), { addSuffix: true, locale: tr })}
                      </span>
                      {user?.id === comment.author_user_id && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-text-body hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-surface-dim/30 p-3 rounded-2xl rounded-tl-none border border-border/50 text-sm text-text-high leading-relaxed">
                    {comment.body}
                  </div>
                  <div className="flex items-center gap-4 mt-1 ml-1">
                    <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                      <Reply className="w-3 h-3" /> Yanıtla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-surface-dim/10">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            className="w-full bg-white border border-border rounded-2xl p-3 pr-12 text-sm text-text-high focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-sm"
            placeholder="Bir yorum yazın... (@ ile birinden bahsedebilirsiniz)"
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button 
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-3 bottom-3 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-text-body mt-2 ml-1 italic">
          Bir kullanıcıyı haberdar etmek için @isim yazabilirsiniz.
        </p>
      </div>
      <ConfirmDialog {...confirmProps} />
    </Card>
  );
}
