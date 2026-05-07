import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X, Save, FileText } from 'lucide-react';
import { requestsApi, type CreateRequestData } from '../../services/requestsApi';
import { customersApi, type Customer } from '../../services/customersApi';
import { jobsApi, type Job } from '../../services/jobsApi';
import { deliveryServiceApi, type DeliveryService } from '../../services/deliveryServiceApi';
import { useToast } from '../ui/Toast';

interface RequestTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  customerId?: number;
  jobId?: number;
}

export function RequestTicketModal({ isOpen, onClose, onSuccess, initialData, customerId, jobId }: RequestTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryService[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState<CreateRequestData>({
    title: '',
    description: '',
    type: 'complaint',
    priority: 'normal',
    customer_id: customerId || 0,
    job_id: jobId,
    delivery_service_id: undefined,
    source: 'internal',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(prev => ({
          ...prev,
          customer_id: customerId || 0,
          job_id: jobId
        }));
      }
    }
  }, [isOpen, initialData, customerId, jobId]);

  useEffect(() => {
    if (formData.customer_id) {
      fetchJobs(formData.customer_id);
      fetchDeliveries(formData.customer_id);
    }
  }, [formData.customer_id]);

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.list();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchJobs = async (cid: number) => {
    try {
      const data = await jobsApi.list({ customer_id: cid });
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs');
    }
  };

  const fetchDeliveries = async (cid: number) => {
    try {
      const data = await deliveryServiceApi.list({ customer_id: cid });
      setDeliveries(data);
    } catch (err) {
      console.error('Failed to fetch deliveries');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      showToast('Lütfen müşteri seçin', 'error');
      return;
    }

    try {
      setLoading(true);
      if (initialData?.id) {
        await requestsApi.update(initialData.id, formData);
        showToast('Talep güncellendi', 'success');
      } else {
        await requestsApi.create(formData);
        showToast('Yeni talep oluşturuldu', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-text-high/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-modal animate-in zoom-in-95 duration-200" noPadding>
        <div className="sticky top-0 z-10 p-6 border-b border-border bg-surface flex items-center justify-between">
          <div>
            <h2 className="text-xl font-jakarta font-bold text-text-high">
              {initialData ? 'Talebi Düzenle' : 'Yeni Şikayet / Talep Kaydı'}
            </h2>
            <p className="text-sm text-text-body mt-1">Müşteri geri bildirimlerini ve destek taleplerini sisteme işleyin.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-dim rounded-xl transition-colors">
            <X className="w-6 h-6 text-text-body" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Konu / Başlık</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
                <input
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Örn: Teslimat Hatası, Parça Değişim Talebi"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Talep Tipi</label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="complaint">Şikayet</option>
                <option value="request">Talep</option>
                <option value="revision">Revizyon</option>
                <option value="support">Destek</option>
                <option value="warranty">Garanti</option>
                <option value="information">Bilgi Talebi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Öncelik</label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik / Acil</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Müşteri</label>
              <select
                required
                disabled={!!customerId}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
                value={formData.customer_id}
                onChange={e => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
              >
                <option value="">Müşteri Seçin</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">İlgili İş (Opsiyonel)</label>
              <select
                disabled={!!jobId}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
                value={formData.job_id || ''}
                onChange={e => setFormData({ ...formData, job_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">İş Seçin</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">İlgili Operasyon (Opsiyonel)</label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                value={formData.delivery_service_id || ''}
                onChange={e => setFormData({ ...formData, delivery_service_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">Operasyon Seçin</option>
                {deliveries.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Kaynak</label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="phone">Telefon</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-posta</option>
                <option value="website">Web Sitesi</option>
                <option value="internal">Dahili</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Açıklama / Detay</label>
              <textarea
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors min-h-[120px]"
                placeholder="Müşterinin talebini veya şikayetini detaylandırın..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Vazgeç</Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Kaydı Oluştur')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
