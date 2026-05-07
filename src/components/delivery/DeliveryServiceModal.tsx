import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X, Save, Calendar, MapPin, Phone, User, FileText } from 'lucide-react';
import { deliveryServiceApi, type CreateDeliveryData } from '../../services/deliveryServiceApi';
import { customersApi, type Customer } from '../../services/customersApi';
import { jobsApi, type Job } from '../../services/jobsApi';
import { useToast } from '../ui/Toast';

interface DeliveryServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  customerId?: number;
  jobId?: number;
}

export function DeliveryServiceModal({ isOpen, onClose, onSuccess, initialData, customerId, jobId }: DeliveryServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState<CreateDeliveryData>({
    title: '',
    type: 'delivery',
    customer_id: customerId || 0,
    job_id: jobId,
    scheduled_at: new Date().toISOString().slice(0, 16),
    address: '',
    contact_person: '',
    contact_phone: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      if (initialData) {
        setFormData({
          ...initialData,
          scheduled_at: new Date(initialData.scheduled_at).toISOString().slice(0, 16),
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      showToast('Lütfen müşteri seçin', 'error');
      return;
    }

    try {
      setLoading(true);
      if (initialData?.id) {
        await deliveryServiceApi.update(initialData.id, formData);
        showToast('Kayıt güncellendi', 'success');
      } else {
        await deliveryServiceApi.create(formData);
        showToast('Yeni planlama oluşturuldu', 'success');
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
              {initialData ? 'Planlamayı Düzenle' : 'Yeni Teslimat / Servis Planla'}
            </h2>
            <p className="text-sm text-text-body mt-1">Lojistik ve saha operasyon detaylarını belirleyin.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-dim rounded-xl transition-colors">
            <X className="w-6 h-6 text-text-body" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Başlık / Konu</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
                <input
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Örn: Mutfak Montajı, Periyodik Bakım"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">İşlem Tipi</label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="delivery">Teslimat</option>
                <option value="service">Servis</option>
                <option value="installation">Montaj</option>
                <option value="pickup">Toplama</option>
                <option value="inspection">Kontrol</option>
                <option value="maintenance">Bakım</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Planlanan Tarih/Saat</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
                <input
                  type="datetime-local"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  value={formData.scheduled_at}
                  onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
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

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Adres</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-body" />
                <textarea
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors min-h-[80px]"
                  placeholder="Teslimat veya servis adresi..."
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">İletişim Kişisi</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ad Soyad"
                  value={formData.contact_person}
                  onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">İletişim Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="05xx..."
                  value={formData.contact_phone}
                  onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-body uppercase tracking-wider">Notlar</label>
              <textarea
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors min-h-[80px]"
                placeholder="Özel talimatlar, araç bilgisi vb."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Vazgeç</Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Planlamayı Kaydet')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
