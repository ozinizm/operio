import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { customersApi } from '../../services/customersApi';
import { jobsApi } from '../../services/jobsApi';
import { tasksApi } from '../../services/tasksApi';
import { financeApi } from '../../services/financeApi';
import { offersApi } from '../../services/offersApi';
import { deliveryServiceApi } from '../../services/deliveryServiceApi';
import { requestsApi } from '../../services/requestsApi';
import { inventoryApi } from '../../services/inventoryApi';
import { useNavigate } from 'react-router-dom';

export type QuickCreateType = 'customer' | 'offer' | 'job' | 'task' | 'finance' | 'delivery_service' | 'request_ticket' | 'inventory_item' | null;

interface GlobalQuickCreateModalProps {
  type: QuickCreateType;
  onClose: () => void;
  onSuccess?: () => void;
}

const TITLES: Record<string, string> = {
  customer: 'Yeni Müşteri',
  offer: 'Yeni Teklif',
  job: 'Yeni İş / Sipariş',
  task: 'Yeni Görev',
  finance: 'Yeni Finans Kaydı',
  delivery_service: 'Yeni Teslimat / Servis',
  request_ticket: 'Yeni Şikayet / Talep',
  inventory_item: 'Yeni Stok Kalemi',
};

export function GlobalQuickCreateModal({ type, onClose, onSuccess }: GlobalQuickCreateModalProps) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (type) {
      setForm({});
      customersApi.list().then(setCustomers).catch(() => {});
      tasksApi.listTeam().then(setTeam).catch(() => {});
    }
  }, [type]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const fieldClass = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelClass = 'block text-xs font-bold text-text-body uppercase opacity-70 mb-1.5';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let created: any;
      if (type === 'customer') {
        if (!form.name) { showToast('Müşteri adı zorunludur.', 'error'); return; }
        created = await customersApi.create({ name: form.name, sector: form.sector, contact_person: form.contact_person, phone: form.phone, email: form.email, status: 'active' });
      } else if (type === 'job') {
        if (!form.title || !form.customer_id) { showToast('Başlık ve müşteri zorunludur.', 'error'); return; }
        created = await jobsApi.create({ title: form.title, customer_id: parseInt(form.customer_id), job_type: form.job_type || 'general', priority: form.priority || 'normal', description: form.description });
      } else if (type === 'task') {
        if (!form.title) { showToast('Görev başlığı zorunludur.', 'error'); return; }
        created = await tasksApi.create({ title: form.title, priority: form.priority || 'normal', status: 'todo', customer_id: form.customer_id ? parseInt(form.customer_id) : null, due_date: form.due_date || null, assignee_user_id: form.assignee_user_id ? parseInt(form.assignee_user_id) : null });
      } else if (type === 'finance') {
        if (!form.title || !form.amount) { showToast('Başlık ve tutar zorunludur.', 'error'); return; }
        created = await financeApi.createEntry({ title: form.title, type: form.fin_type || 'income', amount: parseFloat(form.amount), status: 'pending', category: form.category || '', customer_id: form.customer_id ? parseInt(form.customer_id) : null });
      } else if (type === 'offer') {
        if (!form.title || !form.customer_id) { showToast('Başlık ve müşteri zorunludur.', 'error'); return; }
        created = await offersApi.create({ title: form.title, customer_id: parseInt(form.customer_id), amount: parseFloat(form.amount || '0'), status: 'draft', description: form.description });
      } else if (type === 'delivery_service') {
        if (!form.title || !form.customer_id) { showToast('Başlık ve müşteri zorunludur.', 'error'); return; }
        created = await deliveryServiceApi.create({ title: form.title, customer_id: parseInt(form.customer_id), type: (form.del_type || 'delivery') as any, scheduled_at: form.scheduled_at || new Date().toISOString(), notes: form.notes });
      } else if (type === 'request_ticket') {
        if (!form.title || !form.customer_id) { showToast('Başlık ve müşteri zorunludur.', 'error'); return; }
        created = await requestsApi.create({ title: form.title, customer_id: parseInt(form.customer_id), priority: (form.priority || 'normal') as any, type: (form.req_type || 'complaint') as any, description: form.description });
      } else if (type === 'inventory_item') {
        if (!form.name || !form.unit) { showToast('Ad ve birim zorunludur.', 'error'); return; }
        created = await inventoryApi.create({ ...form, quantity: parseFloat(form.quantity || '0'), min_quantity: parseFloat(form.min_quantity || '0') });
      }

      if (type) {
        showToast(`${TITLES[type]} oluşturuldu.`, 'success');
      }
      if (onSuccess) onSuccess();
      
      // Dispatch global event for other components to refresh
      window.dispatchEvent(new CustomEvent('operio:resource-created', { 
        detail: { type, created } 
      }));

      onClose();
      
      // Navigation logic
      if (type === 'customer') navigate(`/customers/${created.id}`);
      else if (type === 'job') navigate(`/jobs/${created.id}`);
      else if (type === 'task') navigate('/tasks');
      else if (type === 'finance') navigate('/finance');
      else if (type === 'offer') navigate('/offers');
      else if (type === 'delivery_service') navigate('/delivery-service');
      else if (type === 'request_ticket') navigate('/complaints');
      else if (type === 'inventory_item') navigate('/inventory');

    } catch (err: any) {
      showToast(err.response?.data?.detail || 'İşlem başarısız.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!type) return null;

  return (
    <Modal isOpen={!!type} onClose={onClose} title={TITLES[type] || ''} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {type === 'customer' && (<>
          <div>
            <label className={labelClass}>Müşteri / Şirket Adı *</label>
            <input className={fieldClass} value={form.name || ''} onChange={set('name')} placeholder="Ör: ABC Teknoloji A.Ş." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sektör</label>
              <input className={fieldClass} value={form.sector || ''} onChange={set('sector')} placeholder="Teknoloji" />
            </div>
            <div>
              <label className={labelClass}>Yetkili</label>
              <input className={fieldClass} value={form.contact_person || ''} onChange={set('contact_person')} placeholder="Ad Soyad" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Telefon</label>
              <input className={fieldClass} value={form.phone || ''} onChange={set('phone')} placeholder="5551234567" />
            </div>
            <div>
              <label className={labelClass}>E-posta</label>
              <input className={fieldClass} value={form.email || ''} onChange={set('email')} placeholder="info@..." />
            </div>
          </div>
        </>)}

        {type === 'job' && (<>
          <div>
            <label className={labelClass}>İş Başlığı *</label>
            <input className={fieldClass} value={form.title || ''} onChange={set('title')} placeholder="Ör: Mutfak Üretim İşi" required />
          </div>
          <div>
            <label className={labelClass}>Müşteri *</label>
            <select className={fieldClass} value={form.customer_id || ''} onChange={set('customer_id')} required>
              <option value="">Müşteri seçin</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Öncelik</label>
              <select className={fieldClass} value={form.priority || 'normal'} onChange={set('priority')}>
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>İş Tipi</label>
              <input className={fieldClass} value={form.job_type || ''} onChange={set('job_type')} placeholder="Üretim, Servis..." />
            </div>
          </div>
          <div>
            <label className={labelClass}>Açıklama</label>
            <textarea className={`${fieldClass} h-16 resize-none`} value={form.description || ''} onChange={set('description')} />
          </div>
        </>)}

        {type === 'task' && (<>
          <div>
            <label className={labelClass}>Görev Başlığı *</label>
            <input className={fieldClass} value={form.title || ''} onChange={set('title')} placeholder="Ör: Müşteri görüşmesi yapılacak" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Öncelik</label>
              <select className={fieldClass} value={form.priority || 'normal'} onChange={set('priority')}>
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Son Tarih</label>
              <input className={fieldClass} type="date" value={form.due_date || ''} onChange={set('due_date')} />
            </div>
          </div>
          <div>
            <label className={labelClass}>İlgili Müşteri</label>
            <select className={fieldClass} value={form.customer_id || ''} onChange={set('customer_id')}>
              <option value="">Müşteri seçin (opsiyonel)</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Sorumlu Personel</label>
            <select className={fieldClass} value={form.assignee_user_id || ''} onChange={set('assignee_user_id')}>
              <option value="">Personel seçin (opsiyonel)</option>
              {team.map((m: any) => <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.email})</option>)}
            </select>
          </div>
        </>)}

        {type === 'finance' && (<>
          <div className="grid grid-cols-2 gap-2">
            {(['income', 'expense'] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm(p => ({ ...p, fin_type: t }))}
                className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${form.fin_type === t ? (t === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700') : 'border-border text-text-body'}`}>
                {t === 'income' ? '↑ Gelir' : '↓ Gider'}
              </button>
            ))}
          </div>
          <div>
            <label className={labelClass}>Başlık *</label>
            <input className={fieldClass} value={form.title || ''} onChange={set('title')} placeholder="Ör: Müşteri Ödemesi" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tutar (₺) *</label>
              <input className={fieldClass} type="number" value={form.amount || ''} onChange={set('amount')} placeholder="0.00" required />
            </div>
            <div>
              <label className={labelClass}>Kategori</label>
              <input className={fieldClass} value={form.category || ''} onChange={set('category')} placeholder="Kira, Malzeme..." />
            </div>
          </div>
        </>)}

        {type === 'offer' && (<>
          <div>
            <label className={labelClass}>Teklif Başlığı *</label>
            <input className={fieldClass} value={form.title || ''} onChange={set('title')} placeholder="Ör: Mutfak Üretim Teklifi" required />
          </div>
          <div>
            <label className={labelClass}>Müşteri *</label>
            <select className={fieldClass} value={form.customer_id || ''} onChange={set('customer_id')} required>
              <option value="">Müşteri seçin</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tutar (₺)</label>
            <input className={fieldClass} type="number" value={form.amount || ''} onChange={set('amount')} placeholder="0.00" />
          </div>
          <div>
            <label className={labelClass}>Açıklama</label>
            <textarea className={`${fieldClass} h-16 resize-none`} value={form.description || ''} onChange={set('description')} />
          </div>
        </>)}

        {type === 'delivery_service' && (<>
          <div>
            <label className={labelClass}>Kayıt Başlığı *</label>
            <input className={fieldClass} value={form.title || ''} onChange={set('title')} placeholder="Ör: Masa Teslimatı ve Montaj" required />
          </div>
          <div>
            <label className={labelClass}>Müşteri *</label>
            <select className={fieldClass} value={form.customer_id || ''} onChange={set('customer_id')} required>
              <option value="">Müşteri seçin</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tip</label>
              <select className={fieldClass} value={form.del_type || 'delivery'} onChange={set('del_type')}>
                <option value="delivery">Teslimat</option>
                <option value="service">Servis / Bakım</option>
                <option value="installation">Kurulum</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Planlanan Tarih</label>
              <input className={fieldClass} type="date" value={form.scheduled_date || ''} onChange={set('scheduled_date')} />
            </div>
          </div>
        </>)}

        {type === 'request_ticket' && (<>
          <div>
            <label className={labelClass}>Talep Başlığı *</label>
            <input className={fieldClass} value={form.title || ''} onChange={set('title')} placeholder="Ör: Ürün çizik geldi" required />
          </div>
          <div>
            <label className={labelClass}>Müşteri *</label>
            <select className={fieldClass} value={form.customer_id || ''} onChange={set('customer_id')} required>
              <option value="">Müşteri seçin</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tip</label>
              <select className={fieldClass} value={form.req_type || 'complaint'} onChange={set('req_type')}>
                <option value="complaint">Şikayet</option>
                <option value="request">Talep</option>
                <option value="revision">Revizyon</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Öncelik</label>
              <select className={fieldClass} value={form.priority || 'normal'} onChange={set('priority')}>
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Açıklama</label>
            <textarea className={`${fieldClass} h-16 resize-none`} value={form.description || ''} onChange={set('description')} />
          </div>
        </>)}

        {type === 'inventory_item' && (<>
          <div>
            <label className={labelClass}>Ürün / Malzeme Adı *</label>
            <input className={fieldClass} value={form.name || ''} onChange={set('name')} placeholder="Ör: MDF Levha" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SKU / Kod</label>
              <input className={fieldClass} value={form.sku || ''} onChange={set('sku')} placeholder="STK-001" />
            </div>
            <div>
              <label className={labelClass}>Birim *</label>
              <input className={fieldClass} value={form.unit || 'Adet'} onChange={set('unit')} placeholder="Adet, KG..." required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Miktar</label>
              <input className={fieldClass} type="number" value={form.quantity || '0'} onChange={set('quantity')} />
            </div>
            <div>
              <label className={labelClass}>Kritik Stok</label>
              <input className={fieldClass} type="number" value={form.min_quantity || '0'} onChange={set('min_quantity')} />
            </div>
          </div>
        </>)}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>İptal</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
