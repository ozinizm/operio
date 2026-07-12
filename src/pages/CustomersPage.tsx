import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../components/ui/useConfirm';
import { ExcelImportActions } from '../components/shared/ExcelImportActions';
import { Search, Plus, Phone, ChevronRight, Eye, Edit2, UserX, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { customersApi, type Customer } from '../services/customersApi';
import { getErrorMessage } from '../services/apiClient';
import type { ResourceCreatedEvent } from '../types/domain';
import { LoadingState, ErrorState } from '../components/ui/States';
import { CustomerModal } from '../components/customers/CustomerModal';
import { useToast } from '../components/ui/ToastContext';
import { useAuth } from '../context/AuthContextValue';
import { can } from '../utils/permissions';

export default function CustomersPage() {
  const { role, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { confirmProps, confirm } = useConfirm();

  const fetchCustomers = async (q?: string) => {
    setIsLoading(true);
    try {
      const data = await customersApi.list({ q });
      setCustomers(data);
    } catch (err) {
      console.error('Customers load failed:', err);
      setError('Müşteri listesi yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void customersApi.list().then(setCustomers).catch(() => {
      setError('Müşteri listesi yüklenemedi.');
    }).finally(() => setIsLoading(false));

    const handleResourceCreated = (event: Event) => {
      const e = event as ResourceCreatedEvent;
      if (e.detail?.type === 'customer') {
        fetchCustomers();
      }
    };

    window.addEventListener('operio:resource-created', handleResourceCreated);
    return () => window.removeEventListener('operio:resource-created', handleResourceCreated);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const timeout = setTimeout(() => {
      fetchCustomers(e.target.value);
    }, 500);
    return () => clearTimeout(timeout);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handlePassivate = (customer: Customer) => {
    const newStatus = customer.status === 'passive' ? 'active' : 'passive';
    const label = newStatus === 'passive' ? 'pasifleştirilsin' : 'aktifleştirilsin';
    const actionLabel = newStatus === 'passive' ? 'Pasifleştir' : 'Aktifleştir';
    confirm({
      title: `Müşteri ${actionLabel}`,
      description: `"${customer.name}" müşterisi ${label} mi?`,
      confirmLabel: actionLabel,
      cancelLabel: 'Vazgeç',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await customersApi.update(customer.id, { ...customer, status: newStatus });
          showToast(`${customer.name} ${newStatus === 'passive' ? 'pasifleştirildi' : 'aktifleştirildi'}.`, 'success');
          fetchCustomers();
        } catch {
          showToast('Durum güncellenemedi.', 'error');
        }
      },
    });
  };

  const handleDelete = (customer: Customer) => {
    confirm({
      title: 'Müşteriyi Sil',
      description: `"${customer.name}" müşterisi arşivlenecek ve aktif listelerden kaldırılacak.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await customersApi.delete(customer.id);
          showToast(`${customer.name} silindi.`, 'success');
          fetchCustomers();
        } catch (err: unknown) {
          showToast(getErrorMessage(err) || 'Müşteri silinirken hata oluştu.', 'error');
        }
      },
    });
  };

  if (isLoading && customers.length === 0) return <LoadingState message="Müşteriler yükleniyor..." />;
  if (error) return <ErrorState title="Hata" description={error} onRetry={() => fetchCustomers()} />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Aktif</Badge>;
      case 'passive': return <Badge variant="default">Pasif</Badge>;
      case 'prospect': return <Badge variant="warning">Potansiyel</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Müşteriler</h1>
          <p className="text-text-body mt-1">Müşteri portföyünüzü ve detaylarını yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          {can(role, 'customer:create', !!user?.is_super_admin) && (
            <Button onClick={handleNewCustomer}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Müşteri
            </Button>
          )}
        </div>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="w-full lg:max-w-md">
            <Input
              placeholder="Müşteri adı, yetkili veya telefon ara..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <ExcelImportActions />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-dim/30 text-xs uppercase text-text-body font-jakarta">
              <tr>
                <th className="px-6 py-4 font-semibold">Müşteri Adı</th>
                <th className="px-6 py-4 font-semibold">Sektör / Tip</th>
                <th className="px-6 py-4 font-semibold">İletişim</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
                <th className="px-6 py-4 font-semibold">Kayıt Tarihi</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => {
                const menuItems: ActionMenuItem[] = [
                  {
                    label: 'Detayı Gör',
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => navigate(`/customers/${customer.id}`),
                  },
                  {
                    label: 'Düzenle',
                    icon: <Edit2 className="w-4 h-4" />,
                    onClick: () => handleEditCustomer(customer),
                  },
                  {
                    label: customer.status === 'passive' ? 'Aktifleştir' : 'Pasifleştir',
                    icon: <UserX className="w-4 h-4" />,
                    onClick: () => handlePassivate(customer),
                  },
                  {
                    label: 'Sil',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => handleDelete(customer),
                    variant: 'danger',
                  },
                ];
                return (
                  <tr key={customer.id} className="hover:bg-surface-dim/20 transition-colors group">
                    <td className="px-6 py-4 font-medium text-text-high">
                      <Link to={`/customers/${customer.id}`} className="hover:text-primary transition-colors">
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-high font-medium">{customer.sector || 'Belirtilmedi'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-high font-medium">{customer.contact_person || '—'}</div>
                      <div className="text-xs text-text-body">{customer.phone || customer.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 text-text-body text-xs">{new Date(customer.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-right">
                      {(can(role, 'customer:update', !!user?.is_super_admin)
                        || can(role, 'customer:delete', !!user?.is_super_admin)) && (
                        <ActionMenu items={menuItems} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-body italic">
                    Müşteri bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-border">
          {customers.map((customer) => (
            <div key={customer.id} className="p-4 hover:bg-surface-dim/10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <Link to={`/customers/${customer.id}`} className="flex-1">
                  <h3 className="font-bold text-text-high">{customer.name}</h3>
                </Link>
                <div className="flex items-center gap-2">
                  {getStatusBadge(customer.status)}
                  {(can(role, 'customer:update', !!user?.is_super_admin)
                    || can(role, 'customer:delete', !!user?.is_super_admin)) && (
                    <ActionMenu items={[
                      { label: 'Detayı Gör', icon: <Eye className="w-4 h-4" />, onClick: () => navigate(`/customers/${customer.id}`) },
                      { label: 'Düzenle', icon: <Edit2 className="w-4 h-4" />, onClick: () => handleEditCustomer(customer) },
                      { label: customer.status === 'passive' ? 'Aktifleştir' : 'Pasifleştir', icon: <UserX className="w-4 h-4" />, onClick: () => handlePassivate(customer) },
                      { label: 'Sil', icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(customer), variant: 'danger' },
                    ]} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-text-body mb-3">
                <div>
                  <span className="block text-[10px] uppercase font-bold opacity-50">Yetkili</span>
                  <span className="font-medium text-text-high">{customer.contact_person || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold opacity-50">Sektör</span>
                  <span className="font-medium text-text-high">{customer.sector || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-body">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone || '—'}</span>
                <Link to={`/customers/${customer.id}`} className="flex items-center gap-1 ml-auto text-primary font-bold">
                  Detaylar <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCustomers()}
        customer={selectedCustomer}
      />
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
