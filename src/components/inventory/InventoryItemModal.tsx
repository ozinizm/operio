import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { inventoryApi, type InventoryItem } from '../../services/inventoryApi';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: InventoryItem | null;
}

export function InventoryItemModal({ isOpen, onClose, onSuccess, item }: InventoryItemModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'Adet',
    quantity: 0,
    min_quantity: 0,
    purchase_price: 0,
    sale_price: 0,
    supplier: '',
    warehouse_location: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        sku: item.sku || '',
        category: item.category || '',
        unit: item.unit,
        quantity: item.quantity,
        min_quantity: item.min_quantity,
        purchase_price: item.purchase_price || 0,
        sale_price: item.sale_price || 0,
        supplier: item.supplier || '',
        warehouse_location: item.warehouse_location || '',
        notes: item.notes || ''
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        unit: 'Adet',
        quantity: 0,
        min_quantity: 0,
        purchase_price: 0,
        sale_price: 0,
        supplier: '',
        warehouse_location: '',
        notes: ''
      });
    }
    setErrors({});
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Ürün adı zorunludur';
    if (!formData.unit.trim()) newErrors.unit = 'Birim zorunludur';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (item) {
        await inventoryApi.update(item.id, formData);
        showToast('Stok kalemi güncellendi.', 'success');
      } else {
        await inventoryApi.create(formData);
        showToast('Stok kalemi oluşturuldu.', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'İşlem sırasında bir hata oluştu.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-modal relative z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-jakarta font-bold text-text-high">
            {item ? 'Stok Kalemini Düzenle' : 'Yeni Stok Kalemi'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-dim rounded-xl transition-colors">
            <span className="sr-only">Kapat</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Ürün / Malzeme Adı"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Örn: MDF Levha 18mm"
                required
              />
            </div>
            <Input
              label="SKU / Stok Kodu"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Örn: STK-001"
            />
            <Input
              label="Kategori"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Örn: Hammadde"
            />
            <Input
              label="Birim"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={errors.unit}
              placeholder="Örn: Adet, KG, Metre"
              required
            />
            <Input
              label="Mevcut Miktar"
              name="quantity"
              type="number"
              step="any"
              value={formData.quantity}
              onChange={handleChange}
            />
            <Input
              label="Kritik Stok Seviyesi"
              name="min_quantity"
              type="number"
              step="any"
              value={formData.min_quantity}
              onChange={handleChange}
            />
            <Input
              label="Alış Fiyatı"
              name="purchase_price"
              type="number"
              step="any"
              value={formData.purchase_price}
              onChange={handleChange}
            />
            <Input
              label="Satış Fiyatı"
              name="sale_price"
              type="number"
              step="any"
              value={formData.sale_price}
              onChange={handleChange}
            />
            <Input
              label="Tedarikçi"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="Örn: ABC Orman Ürünleri"
            />
            <Input
              label="Depo / Lokasyon"
              name="warehouse_location"
              value={formData.warehouse_location}
              onChange={handleChange}
              placeholder="Örn: A1 Rafı"
            />
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-body uppercase mb-2 ml-1">Notlar</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-sm"
                placeholder="Ürün hakkında ek bilgiler..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Vazgeç</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {item ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
