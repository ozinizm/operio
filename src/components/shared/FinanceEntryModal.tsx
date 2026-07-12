import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { financeApi, type FinanceEntry } from '../../services/financeApi';
import { getErrorMessage } from '../../services/apiClient';
import { useToast } from '../ui/ToastContext';
import { customersApi, type Customer } from '../../services/customersApi';

interface FinanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry?: FinanceEntry | null;
  customerId?: number;
  jobId?: number;
  defaultTitle?: string;
}

export function FinanceEntryModal({ isOpen, onClose, onSuccess, entry, customerId, jobId, defaultTitle }: FinanceEntryModalProps) {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'income',
    amount: '',
    status: 'pending',
    category: '',
    customer_id: '',
    job_id: '',
    due_date: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      customersApi.list().then(setCustomers).catch(() => {});
      if (entry) {
        void Promise.resolve().then(() => setForm({
          title: entry.title || '',
          type: entry.type || 'income',
          amount: String(entry.amount || ''),
          status: entry.status || 'pending',
          category: entry.category || '',
          customer_id: entry.customer_id ? String(entry.customer_id) : '',
          job_id: entry.job_id ? String(entry.job_id) : '',
          due_date: entry.due_date ? entry.due_date.split('T')[0] : '',
          description: entry.description || '',
        }));
      } else {
        void Promise.resolve().then(() => setForm({
          title: defaultTitle || '',
          type: 'income',
          amount: '',
          status: 'pending',
          category: '',
          customer_id: customerId ? String(customerId) : '',
          job_id: jobId ? String(jobId) : '',
          due_date: '',
          description: '',
        }));
      }
    }
  }, [isOpen, entry, customerId, jobId, defaultTitle]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast('Başlık zorunludur.', 'error'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { showToast('Geçerli bir tutar girin.', 'error'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        customer_id: form.customer_id ? parseInt(form.customer_id) : null,
        job_id: form.job_id ? parseInt(form.job_id) : null,
        due_date: form.due_date || null,
      };

      if (entry?.id) {
        await financeApi.updateEntry(entry.id, payload);
        showToast('Kayıt başarıyla güncellendi.', 'success');
      } else {
        await financeApi.createEntry(payload);
        showToast('Finans kaydı oluşturuldu.', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast(getErrorMessage(err) || 'Kayıt oluşturulamadı.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelClass = 'block text-xs font-bold text-text-body uppercase opacity-70 mb-1.5';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Kaydı Düzenle' : 'Yeni Finans Kaydı'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tip Seçimi */}
        <div className="grid grid-cols-2 gap-2">
          {(['income', 'expense'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(p => ({ ...p, type: t }))}
              className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                form.type === t
                  ? t === 'income'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-red-50 border-red-500 text-red-700'
                  : 'border-border text-text-body hover:border-primary'
              }`}
            >
              {t === 'income' ? '↑ Gelir' : '↓ Gider'}
            </button>
          ))}
        </div>

        <div>
          <label className={labelClass}>Başlık *</label>
          <input className={fieldClass} value={form.title} onChange={set('title')} placeholder="Ör: Müşteri Peşinatı" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tutar (₺) *</label>
            <input className={fieldClass} type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
          </div>
          <div>
            <label className={labelClass}>Durum</label>
            <select className={fieldClass} value={form.status} onChange={set('status')}>
              <option value="pending">Bekliyor</option>
              <option value="paid">Ödendi</option>
              <option value="overdue">Gecikmiş</option>
              <option value="cancelled">İptal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Kategori</label>
            <input className={fieldClass} value={form.category} onChange={set('category')} placeholder="Ör: Kira, Malzeme..." />
          </div>
          <div>
            <label className={labelClass}>Vade Tarihi</label>
            <input className={fieldClass} type="date" value={form.due_date} onChange={set('due_date')} />
          </div>
        </div>

        <div>
          <label className={labelClass}>İlgili Müşteri</label>
          <select className={fieldClass} value={form.customer_id} onChange={set('customer_id')}>
            <option value="">Müşteri seçin (opsiyonel)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Açıklama</label>
          <textarea className={`${fieldClass} h-20 resize-none`} value={form.description} onChange={set('description')} placeholder="Ek notlar..." />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>İptal</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : entry ? 'Güncelle' : 'Kayıt Oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
