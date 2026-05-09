import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog, useConfirm } from '../components/ui/ConfirmDialog';
import { GlobalQuickCreateModal, type QuickCreateType } from '../components/shared/GlobalQuickCreateModal';
import {
  Plus, Filter, Search, Clock,
  Calendar, Tag, MessageSquare,
  CheckCircle2, Edit2, Trash2
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { tasksApi } from '../services/tasksApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatDate } from '../utils/formatters';
import { TASK_STATUS_MAP } from '../utils/statusMaps';

const priorityConfig: Record<string, { label: string, color: string }> = {
  'critical': { label: 'Kritik', color: 'text-red-600' },
  'high': { label: 'Yüksek', color: 'text-amber-600' },
  'normal': { label: 'Normal', color: 'text-blue-600' },
  'low': { label: 'Düşük', color: 'text-text-body' }
};

const TASK_STATUSES = [
  { value: 'todo', label: 'Yapılacak' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'review', label: 'İncelemede' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'overdue', label: 'Gecikti' },
];

export default function TasksPage() {
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickCreateType, setQuickCreateType] = useState<QuickCreateType>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch (err) {
      console.error('Tasks load failed:', err);
      setError('Görev listesi yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const handleResourceCreated = (e: any) => {
      if (e.detail?.type === 'task') {
        fetchTasks();
      }
    };

    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, []);

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await tasksApi.update(task.id, { status: newStatus });
      showToast(`Görev ${newStatus === 'completed' ? 'tamamlandı' : 'yapılacaklara alındı'}.`, 'success');
      fetchTasks();
    } catch {
      showToast('Görev güncellenemedi.', 'error');
    }
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      description: task.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await tasksApi.update(editingTask.id, editForm);
      showToast('Görev güncellendi.', 'success');
      setIsEditModalOpen(false);
      fetchTasks();
    } catch {
      showToast('Güncelleme başarısız.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (task: any) => {
    confirm({
      title: 'Görevi Sil',
      description: `"${task.title}" görevi kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await tasksApi.delete(task.id);
          showToast('Görev silindi.', 'success');
          fetchTasks();
        } catch (err: any) {
          showToast(err.response?.data?.detail || 'Silme başarısız.', 'error');
        }
      },
    });
  };

  if (isLoading && tasks.length === 0) return <LoadingState message="Görevler yükleniyor..." />;
  if (error) return <ErrorState title="Hata" description={error} onRetry={() => fetchTasks()} />;

  const fieldClass = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelClass = 'block text-xs font-bold text-text-body uppercase opacity-70 mb-1.5';

  return (
    <>
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Görevler</h1>
          <p className="text-text-body mt-1">Takımınızın günlük iş planını yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filtrele</Button>
          <Button onClick={() => setQuickCreateType('task')}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Görev
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tüm Görevler', count: tasks.length, color: 'text-primary' },
          { label: 'Açık Görevler', count: tasks.filter(t => t.status !== 'completed').length, color: 'text-amber-600' },
          { label: 'Gecikenler', count: tasks.filter(t => t.status === 'overdue').length, color: 'text-red-600' },
          { label: 'Tamamlananlar', count: tasks.filter(t => t.status === 'completed').length, color: 'text-emerald-600' },
        ].map((stat, i) => (
          <Card key={i} className="!p-4 border-l-4 border-l-current shadow-soft">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-text-body opacity-60 tracking-wider">{stat.label}</span>
              <span className={`text-xl font-bold ${stat.color}`}>{stat.count}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-border">
          <div className="max-w-md w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
            <input className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Görev ara..." />
          </div>
        </div>

        <div className="divide-y divide-border">
          {tasks.map(task => {
            const menuItems: ActionMenuItem[] = [
              {
                label: 'Düzenle',
                icon: <Edit2 className="w-4 h-4" />,
                onClick: () => openEdit(task),
              },
              {
                label: task.status === 'completed' ? 'Yeniden Aç' : 'Tamamlandı Yap',
                icon: <CheckCircle2 className="w-4 h-4" />,
                onClick: () => handleToggleComplete(task),
              },
              {
                label: 'Sil',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: () => handleDelete(task),
                variant: 'danger',
              },
            ];
            return (
              <div key={task.id} className="p-4 hover:bg-surface-dim/10 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-1 w-5 h-5 rounded-lg border-2 transition-colors flex-shrink-0 ${task.status === 'completed' ? 'bg-primary border-primary' : 'bg-surface border-border hover:border-primary'}`}
                    />
                    <div>
                      <h3 className={`font-bold text-text-high group-hover:text-primary transition-colors ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="text-xs text-text-body font-medium flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-primary" /> Sorumlu {task.assignee_user_id}
                        </span>
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${priorityConfig[task.priority]?.color || 'text-text-body'}`}>
                          <Clock className="w-3 h-3" /> {priorityConfig[task.priority]?.label || task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="flex flex-col items-end">
                      <Badge variant={TASK_STATUS_MAP[task.status]?.variant as any || 'default'}>
                        {TASK_STATUS_MAP[task.status]?.label || task.status}
                      </Badge>
                      <span className="text-[10px] text-text-body mt-1.5 font-bold flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(task.due_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => showToast('Yorum özelliği yakında aktif olacak.', 'info')}
                        className="p-2 hover:bg-surface-dim rounded-xl text-text-body transition-colors"
                        title="Yorumlar"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <ActionMenu items={menuItems} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && !isLoading && (
            <div className="p-10 text-center text-text-body italic">
              Henüz atanmış görev bulunmuyor.
            </div>
          )}
        </div>
      </Card>
    </div>

    {/* Edit Task Modal */}
    <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Görevi Düzenle" size="md">
      <form onSubmit={handleSaveEdit} className="space-y-4">
        <div>
          <label className={labelClass}>Başlık</label>
          <input className={fieldClass} value={editForm.title || ''} onChange={e => setEditForm((p: any) => ({ ...p, title: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Öncelik</label>
            <select className={fieldClass} value={editForm.priority || 'normal'} onChange={e => setEditForm((p: any) => ({ ...p, priority: e.target.value }))}>
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="critical">Kritik</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Durum</label>
            <select className={fieldClass} value={editForm.status || 'todo'} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}>
              {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Son Tarih</label>
          <input className={fieldClass} type="date" value={editForm.due_date || ''} onChange={e => setEditForm((p: any) => ({ ...p, due_date: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Açıklama</label>
          <textarea className={`${fieldClass} h-20 resize-none`} value={editForm.description || ''} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
          <Button type="submit" className="flex-1" disabled={isSaving}>{isSaving ? 'Kaydediliyor...' : 'Güncelle'}</Button>
        </div>
      </form>
    </Modal>

    <GlobalQuickCreateModal 
      type={quickCreateType} 
      onClose={() => setQuickCreateType(null)} 
      onSuccess={fetchTasks}
    />
    <ConfirmDialog {...confirmProps} />
    </>
  );
}
