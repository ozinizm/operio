import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { customersApi, type Customer } from '../../services/customersApi';
import { getErrorMessage } from '../../services/apiClient';
import { useToast } from '../ui/ToastContext';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

export function CustomerModal({ isOpen, onClose, onSuccess, customer }: CustomerModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  });

  useEffect(() => {
    if (customer) {
      void Promise.resolve().then(() => setFormData({
        name: customer.name || '',
        sector: customer.sector || '',
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        status: customer.status || 'active'
      }));
    } else {
      void Promise.resolve().then(() => setFormData({
        name: '',
        sector: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        status: 'active'
      }));
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (customer?.id) {
        await customersApi.update(customer.id, formData);
        showToast('Müşteri güncellendi.', 'success');
      } else {
        await customersApi.create(formData);
        showToast('Yeni müşteri oluşturuldu.', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      showToast(getErrorMessage(err) || 'Müşteri kaydedilemedi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={customer ? 'Müşteri Düzenle' : 'Yeni Müşteri Oluştur'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-text-high mb-1.5">Müşteri / Şirket Adı *</label>
            <Input 
              required
              placeholder="Örn: Bora Mobilya" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-high mb-1.5">Sektör</label>
            <Input 
              placeholder="Örn: Üretim" 
              value={formData.sector}
              onChange={(e) => setFormData({...formData, sector: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-high mb-1.5">Yetkili Kişi</label>
            <Input 
              placeholder="Ad Soyad" 
              value={formData.contact_person}
              onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-high mb-1.5">E-posta</label>
            <Input 
              type="email"
              placeholder="ornek@sirket.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-high mb-1.5">Telefon</label>
            <Input 
              placeholder="05..." 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-text-high mb-1.5">Adres</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px]"
              placeholder="Tam adres bilgisi..."
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
          <Button type="submit" disabled={isSubmitting}>
            {customer ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
