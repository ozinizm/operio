import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  ArrowRight, 
  Settings, LayoutGrid, List,
  CheckCircle2, AlertTriangle, BarChart3,
  Hammer, Wrench, Lightbulb
} from 'lucide-react';
import { jobsApi } from '../services/jobsApi';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState } from '../components/ui/States';
import { JOB_STATUS_MAP } from '../utils/statusMaps';

const workflows = [
  { id: 1, name: 'Mobilya Üretim Akışı', sector: 'Üretim' },
  { id: 2, name: 'Teknik Servis Akışı', sector: 'Hizmet' },
  { id: 3, name: 'Ajans Proje Akışı', sector: 'Yaratıcı' }
];

export default function OperationsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflows[0]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.list({ status: 'in_progress' });
      // Fetch some planned too if none in progress
      if (data.length < 3) {
        const planned = await jobsApi.list({ status: 'planned' });
        setJobs([...data, ...planned]);
      } else {
        setJobs(data);
      }
      setError(null);
    } catch (err) {
      setError('Operasyonel veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Operasyonlar yükleniyor..." />;
  if (error) return <ErrorState description={error} onRetry={fetchJobs} />;

  return (
    <>
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Operasyon Süreç Takibi</h1>
          <p className="text-text-body mt-1">Sektörel iş akışlarınızı ve operasyonel verimliliği izleyin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsWorkflowModalOpen(true)}><Settings className="w-4 h-4 mr-2" /> İş Akışı Ayarları</Button>
          <div className="flex border border-border rounded-xl p-1 bg-surface shadow-sm">
            <button
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-body hover:bg-surface-dim'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-body hover:bg-surface-dim'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {workflows.map(wf => (
          <button
            key={wf.id}
            onClick={() => setSelectedWorkflow(wf)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all ${
              selectedWorkflow.id === wf.id 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-surface border-border text-text-body hover:border-primary hover:text-primary'
            }`}
          >
            {wf.name}
          </button>
        ))}
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bekleyen', count: jobs.filter(j => j.status === 'planned').length, color: 'border-slate-500' },
          { label: 'Üretimde/Devam Eden', count: jobs.filter(j => j.status === 'in_progress').length, color: 'border-primary' },
          { label: 'Geciken', count: 0, color: 'border-red-500' },
          { label: 'Kapasite', count: '78%', color: 'border-indigo-500' }
        ].map((stat, idx) => (
          <Card key={idx} className={`!p-4 border-t-4 ${stat.color} shadow-soft`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-body">{stat.label}</span>
              <span className="text-xl font-bold text-text-high">{stat.count}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Operational View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" noPadding>
          <CardHeader title="Aktif Operasyonlar" action={<Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>Tümünü Yönet</Button>} />
          <div className="p-4 space-y-4">
            {jobs.length === 0 ? (
              <div className="py-10 text-center text-text-body italic">Aktif operasyon bulunmuyor.</div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-4 border border-border rounded-2xl hover:shadow-md hover:border-primary/20 transition-all group bg-surface cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-text-high flex items-center gap-2 group-hover:text-primary transition-colors">
                        {job.title}
                        {job.priority === 'critical' && <Badge variant="error" className="animate-pulse">Acil</Badge>}
                      </h4>
                      <p className="text-xs text-text-body mt-0.5 font-medium">{job.customer?.name || 'Müşteri Yok'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={JOB_STATUS_MAP[job.status]?.variant as any || 'default'}>
                        {JOB_STATUS_MAP[job.status]?.label || job.status}
                      </Badge>
                      <span className="text-[10px] text-text-body uppercase font-bold opacity-50 block mt-1">{job.responsible_user?.full_name || 'Atanmamış'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-surface-dim rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-700" 
                        style={{ width: `${job.progress}%` }} 
                      />
                    </div>
                    <span className="text-xs font-bold text-text-high">%{Math.round(job.progress)}</span>
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="p-2 hover:bg-primary hover:text-white rounded-xl text-primary transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Operasyonel Sağlık" />
            <div className="space-y-8">
              <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32">
                    <circle className="text-surface-dim" strokeWidth="10" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                    <circle className="text-primary" strokeWidth="10" strokeDasharray={339} strokeDashoffset={339 * 0.15} strokeLinecap="round" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-text-high">85%</span>
                    <span className="text-[10px] text-text-body uppercase font-bold tracking-tighter">Verimlilik</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Zamanında Tamamlama', val: '%92', trend: 'up', icon: CheckCircle2, color: 'text-emerald-500' },
                  { label: 'Hata Oranı', val: '%1.2', trend: 'down', icon: AlertTriangle, color: 'text-red-500' },
                  { label: 'Kapasite Kullanımı', val: '%78', trend: 'up', icon: BarChart3, color: 'text-indigo-500' },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-surface-dim/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs font-medium text-text-body">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-text-high">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

      <Modal isOpen={isWorkflowModalOpen} onClose={() => setIsWorkflowModalOpen(false)} title="İş Akışı Şablonları" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-text-body mb-2">
            Sektörünüze uygun şablonu bir iş / sipariş üzerinden uygulayabilirsiniz.
          </p>
          {[
            {
              icon: Hammer,
              name: 'Mobilya Üretim Akışı',
              key: 'furniture_production',
              color: 'bg-amber-50 text-amber-600',
              stages: ['Ölçü Alındı', 'Malzeme Hazırlandı', 'Üretimde', 'Kalite Kontrol', 'Montaj Planlandı', 'Teslim Edildi'],
            },
            {
              icon: Wrench,
              name: 'Teknik Servis Akışı',
              key: 'technical_service',
              color: 'bg-blue-50 text-blue-600',
              stages: ['Talep Alındı', 'Servis Planlandı', 'Teknik Ekip Atandı', 'Parça Bekleniyor', 'İşlem Tamamlandı', 'Müşteri Onayı Alındı'],
            },
            {
              icon: Lightbulb,
              name: 'Ajans Proje Akışı',
              key: 'agency_project',
              color: 'bg-purple-50 text-purple-600',
              stages: ['Brief Alındı', 'Tasarımda', 'Revizyonda', 'Onaylandı', 'Yayına Alındı', 'Raporlandı'],
            },
          ].map(wf => {
            const Icon = wf.icon;
            return (
              <div key={wf.key} className="border border-border rounded-2xl p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${wf.color}`}><Icon className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-text-high">{wf.name}</h4>
                    <p className="text-xs text-text-body">{wf.stages.length} aşama</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {wf.stages.map((s, i) => (
                    <span key={i} className="text-[10px] font-bold bg-surface-dim px-2.5 py-1 rounded-full text-text-body">
                      {i + 1}. {s}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-text-body italic mt-3">
                  Bu şablonu uygulamak için ilgili iş detay sayfasına gidin.
                </p>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
