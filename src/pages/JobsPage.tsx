import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../components/ui/useConfirm';
import { GlobalQuickCreateModal, type QuickCreateType } from '../components/shared/GlobalQuickCreateModal';
import { ExcelImportActions } from '../components/shared/ExcelImportActions';
import {
  Plus, Search,
  Clock, ChevronRight, User,
  Eye, RefreshCw, Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/ToastContext';
import { jobsApi, type Job } from '../services/jobsApi';
import { getErrorMessage } from '../services/apiClient';
import type { ResourceCreatedEvent } from '../types/domain';
import { LoadingState, ErrorState } from '../components/ui/States';
import { formatDate } from '../utils/formatters';
import { JOB_STATUS_MAP, JOB_TYPE_LABELS, PRIORITY_LABELS, enumLabel } from '../utils/statusMaps';
import { useAuth } from '../context/AuthContextValue';
import { can } from '../utils/permissions';

const JOB_STATUSES = [
  { value: 'planned', label: 'Planlandı' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
];

export default function JobsPage() {
  const { role, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { confirmProps, confirm } = useConfirm();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickCreateType, setQuickCreateType] = useState<QuickCreateType>(null);
  const [statusJob, setStatusJob] = useState<Job | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobsApi.list();
      setJobs(data);
    } catch (err) {
      console.error('Jobs load failed:', err);
      setError('İş listesi yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void jobsApi.list().then(setJobs).catch(() => {
      setError('İş listesi yüklenemedi.');
    }).finally(() => setIsLoading(false));

    const handleResourceCreated = (event: Event) => {
      const e = event as ResourceCreatedEvent;
      if (e.detail?.type === 'job') {
        fetchJobs();
      }
    };

    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, []);

  const openStatusModal = (job: Job) => {
    setStatusJob(job);
    setNewStatus(job.status);
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusJob || newStatus === statusJob.status) { setIsStatusModalOpen(false); return; }
    setIsUpdating(true);
    try {
      await jobsApi.update(statusJob.id, { status: newStatus });
      showToast('İş durumu güncellendi.', 'success');
      setIsStatusModalOpen(false);
      fetchJobs();
    } catch {
      showToast('Durum güncellenemedi.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = (job: Job) => {
    confirm({
      title: 'İşi Sil',
      description: `"${job.title}" işi arşivlenecek ve aktif listelerden kaldırılacak.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await jobsApi.delete(job.id);
          showToast('İş silindi.', 'success');
          fetchJobs();
        } catch (err: unknown) {
          showToast(getErrorMessage(err) || 'Silme işlemi başarısız.', 'error');
        }
      },
    });
  };

  if (isLoading && jobs.length === 0) return <LoadingState message="İşler yükleniyor..." />;
  if (error) return <ErrorState title="Hata" description={error} onRetry={() => fetchJobs()} />;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="error">Kritik</Badge>;
      case 'high': return <Badge variant="error">Yüksek</Badge>;
      case 'normal': return <Badge variant="default">Normal</Badge>;
      case 'low': return <Badge variant="info">Düşük</Badge>;
      default: return <Badge variant="default">{enumLabel(priority, PRIORITY_LABELS)}</Badge>;
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Siparişler / İşler</h1>
          <p className="text-text-body mt-1">Devam eden operasyonları ve teslimat tarihlerini yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          {can(role, 'job:create', !!user?.is_super_admin) && (
            <Button onClick={() => setQuickCreateType('job')}>
              <Plus className="w-4 h-4 mr-2" /> Yeni İş Oluştur
            </Button>
          )}
        </div>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 lg:max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
              placeholder="İş adı veya müşteri ara..."
            />
          </div>
          <ExcelImportActions />
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-dim/30 text-xs uppercase text-text-body font-jakarta">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">İş / Sipariş Bilgisi</th>
                <th className="px-6 py-4 font-bold tracking-wider">Tür</th>
                <th className="px-6 py-4 font-bold tracking-wider">Durum</th>
                <th className="px-6 py-4 font-bold tracking-wider">İlerleme</th>
                <th className="px-6 py-4 font-bold tracking-wider">Sorumlu</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const menuItems: ActionMenuItem[] = [
                  {
                    label: 'Detayı Gör',
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => navigate(`/jobs/${job.id}`),
                  },
                  {
                    label: 'Durumu Güncelle',
                    icon: <RefreshCw className="w-4 h-4" />,
                    onClick: () => openStatusModal(job),
                  },
                  {
                    label: 'Sil',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDelete(job),
                    variant: 'danger',
                  },
                ];
                return (
                  <tr key={job.id} className="hover:bg-surface-dim/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/jobs/${job.id}`} className="block">
                        <div className="font-bold text-text-high group-hover:text-primary transition-colors">{job.title}</div>
                        <div className="text-xs text-text-body mt-0.5">
                          {job.customer?.name || 'Müşteri Bilgisi Yok'} •
                          <span className="font-medium text-red-500 ml-1">Teslimat: {job.due_date ? formatDate(job.due_date) : '—'}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-text-body bg-surface-dim/50 px-2 py-1 rounded-md" title={enumLabel(job.job_type || 'general', JOB_TYPE_LABELS)}>{enumLabel(job.job_type || 'general', JOB_TYPE_LABELS)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={JOB_STATUS_MAP[job.status]?.variant || 'default'}>
                        {JOB_STATUS_MAP[job.status]?.label || job.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 w-40">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-surface-dim rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${job.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-text-high">%{job.progress}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">S</div>
                        <span className="text-xs font-medium text-text-high">Sorumlu {job.responsible_user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(can(role, 'job:update', !!user?.is_super_admin)
                        || can(role, 'job:delete', !!user?.is_super_admin)) && (
                        <ActionMenu items={menuItems} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-body italic">Aktif iş bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-border">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 hover:bg-surface-dim/10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <Link to={`/jobs/${job.id}`} className="block">
                    <h3 className="font-bold text-text-high">{job.title}</h3>
                    <p className="text-xs text-text-body mt-0.5">{job.customer?.name || 'Müşteri Yok'}</p>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(job.priority)}
                  {(can(role, 'job:update', !!user?.is_super_admin)
                    || can(role, 'job:delete', !!user?.is_super_admin)) && (
                    <ActionMenu items={[
                      { label: 'Detayı Gör', icon: <Eye className="w-4 h-4" />, onClick: () => navigate(`/jobs/${job.id}`) },
                      { label: 'Durumu Güncelle', icon: <RefreshCw className="w-4 h-4" />, onClick: () => openStatusModal(job) },
                      { label: 'Sil', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(job), variant: 'danger' },
                    ]} />
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-body flex items-center gap-1"><Clock className="w-3 h-3" /> Teslimat: {job.due_date ? formatDate(job.due_date) : '—'}</span>
                  <Badge variant={JOB_STATUS_MAP[job.status]?.variant || 'default'}>
                    {JOB_STATUS_MAP[job.status]?.label || job.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-surface-dim rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${job.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-text-high">%{job.progress}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-text-body" />
                    <span className="text-xs text-text-high">Sorumlu {job.responsible_user_id}</span>
                  </div>
                  <Link to={`/jobs/${job.id}`} className="text-primary font-bold text-xs flex items-center gap-1">
                    İncele <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Status Update Modal */}
    <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Durum Güncelle" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-body">
          <span className="font-bold text-text-high">"{statusJob?.title}"</span> için yeni durumu seçin:
        </p>
        <div className="space-y-2">
          {JOB_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setNewStatus(s.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                newStatus === s.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-text-body hover:border-primary/50'
              }`}
            >
              {s.label}
              {statusJob?.status === s.value && <span className="ml-2 text-[10px] opacity-60 font-normal">Mevcut</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setIsStatusModalOpen(false)}>İptal</Button>
          <Button className="flex-1" onClick={handleStatusUpdate} disabled={isUpdating || newStatus === statusJob?.status}>
            {isUpdating ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </div>
      </div>
    </Modal>

    <GlobalQuickCreateModal 
      type={quickCreateType} 
      onClose={() => setQuickCreateType(null)} 
      onSuccess={fetchJobs}
    />
    <ConfirmDialog {...confirmProps} />
    </>
  );
}
