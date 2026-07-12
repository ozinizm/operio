import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  User, Calendar, Clock, ChevronLeft, 
  CheckCircle2, AlertCircle, Plus,
  DollarSign, Loader2, Workflow, CheckCircle
} from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';
import { jobsApi, type Job } from '../services/jobsApi';
import { operationsApi, type JobStage } from '../services/operationsApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { FileSection } from '../components/shared/FileSection';
import { CommentsPanel } from '../components/collaboration/CommentsPanel';
import { EntityWatchButton } from '../components/collaboration/EntityWatchButton';
import { JobDeliveryList } from '../components/delivery/JobDeliveryList';
import { JobRequestList } from '../components/requests/JobRequestList';
import { DeliveryServiceDetailDrawer } from '../components/delivery/DeliveryServiceDetailDrawer';
import { DeliveryServiceModal } from '../components/delivery/DeliveryServiceModal';
import { RequestTicketDetailDrawer } from '../components/requests/RequestTicketDetailDrawer';
import { RequestTicketModal } from '../components/requests/RequestTicketModal';
import { PRIORITY_LABELS, enumLabel } from '../utils/statusMaps';
import { FinanceEntryModal } from '../components/shared/FinanceEntryModal';


export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<JobStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [isDeliveryDrawerOpen, setIsDeliveryDrawerOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const jobId = parseInt(id);
    void Promise.all([jobsApi.get(jobId), operationsApi.listStages(jobId)]).then(([jobData, stagesData]) => {
      setJob(jobData);
      setStages(stagesData);
    }).catch((err: unknown) => {
      console.error('Data load failed:', err);
      setError('İş detayları yüklenemedi.');
    }).finally(() => setIsLoading(false));
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const jobId = parseInt(id);
      const [jobData, stagesData] = await Promise.all([
        jobsApi.get(jobId),
        operationsApi.listStages(jobId)
      ]);
      setJob(jobData);
      setStages(stagesData);
    } catch (err) {
      console.error('Data load failed:', err);
      setError('İş detayları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async (templateName: string) => {
    if (!id) return;
    try {
      setIsApplyingTemplate(true);
      await operationsApi.applyTemplate(parseInt(id), templateName);
      showToast('İş akışı şablonu uygulandı.', 'success');
      fetchData(); // Refresh
    } catch {
      showToast('Şablon uygulanırken hata oluştu.', 'error');
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleToggleStage = async (stageId: number, currentStatus: string) => {
    if (!id) return;
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      await operationsApi.updateStage(parseInt(id), stageId, { status: newStatus });
      fetchData(); // Refresh to get updated job progress too
    } catch {
      showToast('Aşama güncellenirken hata oluştu.', 'error');
    }
  };

  if (isLoading) return <LoadingState message="İş detayları yükleniyor..." />;
  if (error || !job) return <ErrorState description={error || 'İş bulunamadı.'} onRetry={fetchData} />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge variant="info">Yeni</Badge>;
      case 'planned': return <Badge variant="default">Planlandı</Badge>;
      case 'in_progress': return <Badge variant="warning">Devam Ediyor</Badge>;
      case 'completed': return <Badge variant="success">Tamamlandı</Badge>;
      case 'delivered': return <Badge variant="success">Teslim Edildi</Badge>;
      case 'cancelled': return <Badge variant="error">İptal</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/jobs" className="p-2 hover:bg-surface-dim rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-jakarta font-bold text-text-high">{job.title}</h1>
              {getStatusBadge(job.status)}
            </div>
            <p className="text-sm text-text-body mt-1">
              Müşteri: <Link to={`/customers/${job.customer_id}`} className="text-primary font-bold hover:underline">{job.customer?.name || 'Müşteri Bilgisi Yok'}</Link> • #JOB-{job.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EntityWatchButton entityType="job" entityId={parseInt(id || '0')} />
          <Button onClick={() => showToast('İş başarıyla tamamlandı.', 'success')} disabled={job.status === 'completed'}><CheckCircle2 className="w-4 h-4 mr-2" /> İşlemi Tamamla</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Stages & Tasks */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-jakarta font-bold text-text-high">İlerleme Durumu</h3>
                  <p className="text-xs text-text-body mt-1">Aşamalar tamamlandıkça otomatik güncellenir.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">%{Math.round(job.progress)}</span>
                </div>
              </div>
              <div className="w-full h-3 bg-surface-dim rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${job.progress}%` }} />
              </div>
            </div>
          </Card>

          {/* Process Stages */}
          <Card noPadding>
            <CardHeader 
              title="Operasyon Süreci" 
              action={
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleApplyTemplate('furniture_production')} disabled={isApplyingTemplate}>
                    {isApplyingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Workflow className="w-4 h-4 mr-2" />}
                    Şablon Uygula
                  </Button>
                </div>
              }
            />
            <div className="p-4">
              {stages.length === 0 ? (
                <div className="py-12 text-center">
                  <Workflow className="w-12 h-12 text-text-body/20 mx-auto mb-4" />
                  <p className="text-text-body text-sm mb-4">Bu iş için henüz bir operasyon süreci tanımlanmamış.</p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleApplyTemplate('furniture_production')}>Mobilya Üretim</Button>
                    <Button variant="outline" size="sm" onClick={() => handleApplyTemplate('technical_service')}>Teknik Servis</Button>
                    <Button variant="outline" size="sm" onClick={() => handleApplyTemplate('agency_project')}>Ajans/Proje</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stages.map((stage) => (
                    <div 
                      key={stage.id} 
                      onClick={() => handleToggleStage(stage.id, stage.status)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${stage.status === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-surface-dim/20 border-border hover:border-primary'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${stage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-dim text-text-body'}`}>
                          {stage.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                        </span>
                        {stage.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <h4 className={`font-bold text-sm ${stage.status === 'completed' ? 'text-emerald-900' : 'text-text-high'}`}>{stage.title}</h4>
                      {stage.notes && <p className="text-xs text-text-body mt-2 line-clamp-1">{stage.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Tasks, Deliveries, Requests, Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Alt Görevler" action={<Button variant="ghost" size="sm" onClick={() => showToast('Yeni görev eklendi.', 'success')}><Plus className="w-4 h-4" /></Button>} />
              <div className="p-10 text-center text-text-body italic">
                Bu işe bağlı alt görev bulunmuyor. Görevler sekmesinden yönetim sağlayabilirsiniz.
              </div>
            </Card>

            <JobDeliveryList 
              jobId={parseInt(id || '0')} 
              customerId={job.customer_id}
              onSelect={(id) => { setSelectedDeliveryId(id); setIsDeliveryDrawerOpen(true); }}
              onCreate={() => setIsDeliveryModalOpen(true)}
            />

            <JobRequestList 
              jobId={parseInt(id || '0')} 
              customerId={job.customer_id}
              onSelect={(id) => { setSelectedRequestId(id); setIsRequestDrawerOpen(true); }}
              onCreate={() => setIsRequestModalOpen(true)}
            />

            <FileSection entityType="job" entityId={parseInt(id || '0')} />
          </div>

          <CommentsPanel entityType="job" entityId={parseInt(id || '0')} />
        </div>

        {/* Right Column: Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="İş Detayları" />
            <div className="space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-body font-medium flex items-center gap-2"><User className="w-4 h-4 text-primary"/> Sorumlu</span>
                <span className="font-bold text-text-high">{job.responsible_user?.full_name || 'Atanmamış'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-body font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500"/> Başlangıç</span>
                <span className="font-bold text-text-high">{new Date(job.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-body font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-red-500"/> Bitiş</span>
                <span className="font-bold text-red-600">{job.due_date ? new Date(job.due_date).toLocaleDateString('tr-TR') : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-body font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500"/> Öncelik</span>
                <Badge variant={job.priority === 'high' || job.priority === 'critical' ? 'error' : 'default'}>{enumLabel(job.priority, PRIORITY_LABELS)}</Badge>
              </div>
            </div>
          </Card>

          <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 p-6 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-jakarta font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6" /> Finansal Durum
              </h3>
              <p className="text-sm opacity-80">Bu işe bağlı gelir kaydını kontrollü olarak oluşturun. Aynı iş için ikinci gelir kaydı engellenir.</p>
              <Button onClick={() => setIsFinanceModalOpen(true)} className="w-full mt-6 bg-white text-primary hover:bg-surface-dim border-none shadow-lg">Gelir Kaydı Ekle</Button>
            </div>
            <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
          </Card>

          <Card>
            <CardHeader title="İş Geçmişi" />
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-dim">
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-surface border-2 border-primary z-10" />
                <p className="text-xs font-bold text-text-high">İş başlatıldı</p>
                <p className="text-[10px] text-text-body font-medium opacity-50 mt-1">{new Date(job.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <DeliveryServiceDetailDrawer
        isOpen={isDeliveryDrawerOpen}
        onClose={() => setIsDeliveryDrawerOpen(false)}
        deliveryId={selectedDeliveryId}
        onUpdate={fetchData}
        onEdit={() => setIsDeliveryModalOpen(true)}
      />

      <DeliveryServiceModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        onSuccess={fetchData}
        customerId={job.customer_id}
        jobId={parseInt(id || '0')}
      />

      <RequestTicketDetailDrawer
        isOpen={isRequestDrawerOpen}
        onClose={() => setIsRequestDrawerOpen(false)}
        requestId={selectedRequestId}
        onUpdate={fetchData}
        onEdit={() => setIsRequestModalOpen(true)}
      />

      <RequestTicketModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchData}
        customerId={job.customer_id}
        jobId={parseInt(id || '0')}
      />
      <FinanceEntryModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        onSuccess={fetchData}
        customerId={job.customer_id}
        jobId={job.id}
        defaultTitle={`${job.title} geliri`}
      />
    </div>
  );
}
