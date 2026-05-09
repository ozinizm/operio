import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog, useConfirm } from '../components/ui/ConfirmDialog';
import { 
  Search, Filter, Plus, FileSpreadsheet, 
  Download, Edit2, Trash2, AlertTriangle, 
  Package, TrendingDown, DollarSign
} from 'lucide-react';
import { inventoryApi, type InventoryItem, type InventorySummary } from '../services/inventoryApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { InventoryItemModal } from '../components/inventory/InventoryItemModal';
import { useToast } from '../components/ui/Toast';
import { Link } from 'react-router-dom';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  const fetchData = async (search?: string) => {
    setIsLoading(true);
    try {
      const [itemsData, summaryData] = await Promise.all([
        inventoryApi.list({ search }),
        inventoryApi.getSummary()
      ]);
      setItems(itemsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Inventory load failed:', err);
      setError('Stok listesi yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleResourceCreated = (e: any) => {
      if (e.detail?.type === 'inventory_item') {
        fetchData();
      }
    };

    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const timeout = setTimeout(() => {
      fetchData(e.target.value);
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleNewItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: InventoryItem) => {
    confirm({
      title: 'Stok Kalemini Sil',
      description: `"${item.name}" stoktan tamamen kaldırılacak. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await inventoryApi.delete(item.id);
          showToast(`${item.name} silindi.`, 'success');
          fetchData();
        } catch (err) {
          showToast('Silme işlemi başarısız.', 'error');
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Aktif</Badge>;
      case 'low_stock': return <Badge variant="warning">Kritik Stok</Badge>;
      case 'out_of_stock': return <Badge variant="error">Stokta Yok</Badge>;
      case 'passive': return <Badge variant="default">Pasif</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading && items.length === 0) return <LoadingState message="Stok verileri yükleniyor..." />;
  if (error) return <ErrorState title="Hata" description={error} onRetry={() => fetchData()} />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Stok Yönetimi</h1>
          <p className="text-text-body mt-1">Ürün, malzeme ve yedek parça stoklarını takip edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/data-import">
            <Button variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel'den Aktar
            </Button>
          </Link>
          <Button onClick={handleNewItem}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Stok Kalemi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-body uppercase opacity-60">Toplam Kalem</p>
              <h3 className="text-xl font-jakarta font-bold text-text-high">{summary?.total_items || 0}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-body uppercase opacity-60">Kritik Stok</p>
              <h3 className="text-xl font-jakarta font-bold text-text-high">{summary?.low_stock_items || 0}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-body uppercase opacity-60">Stokta Yok</p>
              <h3 className="text-xl font-jakarta font-bold text-text-high">{summary?.out_of_stock_items || 0}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-body uppercase opacity-60">Tahmini Stok Değeri</p>
              <h3 className="text-xl font-jakarta font-bold text-text-high">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', notation: 'compact' }).format(summary?.total_stock_value || 0)}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="w-full lg:max-w-md">
            <Input
              placeholder="Stok adı veya kodu ara..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="flex items-center gap-3">
            <a href={inventoryApi.getTemplateUrl()} download>
              <Button variant="ghost" size="sm" className="text-xs font-bold">
                <Download className="w-3 h-3 mr-2" /> Şablon İndir
              </Button>
            </a>
            <a href={inventoryApi.getExportUrl()} download>
              <Button variant="ghost" size="sm" className="text-xs font-bold">
                <Download className="w-3 h-3 mr-2" /> Excel'e Aktar
              </Button>
            </a>
            <Button variant="outline" size="sm">
              <Filter className="w-3 h-3 mr-2" /> Filtre
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-dim/30 text-xs uppercase text-text-body font-jakarta">
              <tr>
                <th className="px-6 py-4 font-semibold">Stok Kodu / Adı</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Miktar</th>
                <th className="px-6 py-4 font-semibold">Birim</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
                <th className="px-6 py-4 font-semibold">Fiyat (Alış/Satış)</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const menuItems: ActionMenuItem[] = [
                  {
                    label: 'Düzenle',
                    icon: <Edit2 className="w-4 h-4" />,
                    onClick: () => handleEditItem(item),
                  },
                  {
                    label: 'Sil',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDelete(item),
                    variant: 'danger',
                  },
                ];
                return (
                  <tr key={item.id} className="hover:bg-surface-dim/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold text-text-body opacity-50 uppercase tracking-wider">{item.sku || 'SKU YOK'}</div>
                      <div className="font-bold text-text-high">{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-high font-medium">{item.category || '—'}</div>
                      <div className="text-[10px] text-text-body">{item.warehouse_location || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${item.status === 'out_of_stock' ? 'text-red-600' : item.status === 'low_stock' ? 'text-amber-600' : 'text-text-high'}`}>
                        {item.quantity}
                      </div>
                      <div className="text-[10px] text-text-body">Kritik: {item.min_quantity}</div>
                    </td>
                    <td className="px-6 py-4 text-text-body">{item.unit}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-text-high">{item.purchase_price ? `${item.purchase_price} TL` : '—'}</div>
                      <div className="text-[10px] text-text-body">{item.sale_price ? `${item.sale_price} TL` : '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu items={menuItems} />
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-text-body italic">
                    Stok kalemi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-[10px] font-bold text-text-body opacity-50 uppercase tracking-wider mb-1">{item.sku || 'SKU YOK'}</div>
                  <h3 className="font-bold text-text-high">{item.name}</h3>
                </div>
                <ActionMenu items={[
                  { label: 'Düzenle', icon: <Edit2 className="w-4 h-4" />, onClick: () => handleEditItem(item) },
                  { label: 'Sil', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(item), variant: 'danger' },
                ]} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-surface-dim/30 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold opacity-50">Miktar</span>
                  <span className="font-bold text-text-high">{item.quantity} {item.unit}</span>
                </div>
                <div className="bg-surface-dim/30 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold opacity-50">Durum</span>
                  {getStatusBadge(item.status)}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-body">{item.category || 'Kategorisiz'}</span>
                <span className="font-bold text-primary">{item.sale_price ? `${item.sale_price} TL` : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <InventoryItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData()}
        item={selectedItem}
      />
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
