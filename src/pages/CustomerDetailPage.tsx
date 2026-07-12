import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Phone, Mail, MapPin, 
  ChevronLeft, User, Edit2, UserX, Trash2
} from 'lucide-react';
import { customersApi, type Customer } from '../services/customersApi';
import { LoadingState, ErrorState } from '../components/ui/States';
import { FileSection } from '../components/shared/FileSection';
import { CommentsPanel } from '../components/collaboration/CommentsPanel';
import { EntityWatchButton } from '../components/collaboration/EntityWatchButton';
import { CustomerDeliveryList } from '../components/delivery/CustomerDeliveryList';
import { CustomerRequestList } from '../components/requests/CustomerRequestList';
import { DeliveryServiceDetailDrawer } from '../components/delivery/DeliveryServiceDetailDrawer';
import { DeliveryServiceModal } from '../components/delivery/DeliveryServiceModal';
import { RequestTicketDetailDrawer } from '../components/requests/RequestTicketDetailDrawer';
import { RequestTicketModal } from '../components/requests/RequestTicketModal';
import { useAuth } from '../context/AuthContextValue';
import { can } from '../utils/permissions';
import { CustomerModal } from '../components/customers/CustomerModal';
import { GlobalQuickCreateModal, type QuickCreateType } from '../components/shared/GlobalQuickCreateModal';
import { ActionMenu } from '../components/ui/ActionMenu';
import { useToast } from '../components/ui/ToastContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../components/ui/useConfirm';


export default function CustomerDetailPage() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Aktif İşler');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<QuickCreateType>(null);
  
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [isDeliveryDrawerOpen, setIsDeliveryDrawerOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);


  const fetchCustomer = async () => {
      if (!id) return;
      try {
        const data = await customersApi.get(parseInt(id));
        setCustomer(data);
      } catch (err) {
        console.error('Customer load failed:', err);
        setError('Müşteri detayları yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (!id) return;
    void customersApi.get(parseInt(id)).then(setCustomer).catch((err: unknown) => {
      console.error('Customer load failed:', err);
      setError('Müşteri detayları yüklenemedi.');
    }).finally(() => setIsLoading(false));
  }, [id]);

  const toggleCustomerStatus = () => {
    if (!customer) return;
    const nextStatus = customer.status === 'passive' ? 'active' : 'passive';
    confirm({
      title: nextStatus === 'passive' ? 'Müşteriyi Pasifleştir' : 'Müşteriyi Aktifleştir',
      description: `${customer.name} müşterisinin durumu değiştirilecek.`,
      confirmLabel: nextStatus === 'passive' ? 'Pasifleştir' : 'Aktifleştir',
      variant: 'warning',
      onConfirm: async () => {
        await customersApi.update(customer.id, { status: nextStatus });
        await fetchCustomer();
        showToast(nextStatus === 'passive' ? 'Müşteri pasifleştirildi.' : 'Müşteri aktifleştirildi.', 'success');
      },
    });
  };

  const deleteCustomer = () => {
    if (!customer) return;
    confirm({
    title: 'Müşteriyi Sil',
    description: `${customer.name} müşterisi arşivlenecek.`,
    confirmLabel: 'Sil',
    variant: 'danger',
    onConfirm: async () => {
      await customersApi.delete(customer.id);
      showToast('Müşteri silindi.', 'success');
      navigate('/customers');
    },
    });
  };

  if (isLoading) return <LoadingState message="Müşteri bilgileri yükleniyor..." />;
  if (error || !customer) return <ErrorState title="Hata" description={error || 'Müşteri bulunamadı.'} onRetry={() => window.location.reload()} />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Aktif</Badge>;
      case 'passive': return <Badge variant="default">Pasif</Badge>;
      case 'prospect': return <Badge variant="warning">Potansiyel</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex items-start gap-3 sm:gap-4">
          <Link to="/customers" className="p-2 hover:bg-surface-dim rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 text-2xl font-jakarta font-bold text-text-high break-words">{customer.name}</h1>
              {getStatusBadge(customer.status)}
            </div>
            <p className="text-text-body mt-1">{customer.sector || 'Sektör Belirtilmedi'} • Kurumsal</p>
          </div>
        </div>
        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto">
          <EntityWatchButton entityType="customer" entityId={parseInt(id || '0')} />
          {can(role, 'customer:update', !!user?.is_super_admin) && (
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsEditModalOpen(true)}>Düzenle</Button>
          )}
          {can(role, 'job:create', !!user?.is_super_admin) && (
            <Button className="w-full sm:w-auto" onClick={() => setQuickCreateType('job')}>Yeni İş Oluştur</Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs font-medium text-text-body mb-1 uppercase tracking-wider">Aktif İşler</p>
          <p className="text-xl font-bold text-text-high">0</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium text-text-body mb-1 uppercase tracking-wider">Toplam İş</p>
          <p className="text-xl font-bold text-text-high">0</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium text-text-body mb-1 uppercase tracking-wider">Teklif Toplamı</p>
          <p className="text-xl font-bold text-text-high">₺0</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-medium text-text-body mb-1 uppercase tracking-wider">Bakiye</p>
          <p className="text-xl font-bold text-primary">₺0</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Contact Info & Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader
              title="İletişim Bilgileri"
              action={(can(role, 'customer:update', !!user?.is_super_admin)
                || can(role, 'customer:delete', !!user?.is_super_admin)) ? (
                <ActionMenu items={[
                  { label: 'Düzenle', icon: <Edit2 className="w-4 h-4" />, onClick: () => setIsEditModalOpen(true) },
                  { label: customer.status === 'passive' ? 'Aktifleştir' : 'Pasifleştir', icon: <UserX className="w-4 h-4" />, onClick: toggleCustomerStatus },
                  { label: 'Sil', icon: <Trash2 className="w-4 h-4" />, onClick: deleteCustomer, variant: 'danger' },
                ]} />
              ) : undefined}
            />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-dim rounded-lg"><User className="w-4 h-4 text-text-body" /></div>
                <div>
                  <p className="text-xs text-text-body">Yetkili Kişi</p>
                  <p className="text-sm font-medium text-text-high">{customer.contact_person || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-dim rounded-lg"><Phone className="w-4 h-4 text-text-body" /></div>
                <div>
                  <p className="text-xs text-text-body">Telefon</p>
                  <p className="text-sm font-medium text-text-high">{customer.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-dim rounded-lg"><Mail className="w-4 h-4 text-text-body" /></div>
                <div>
                  <p className="text-xs text-text-body">E-posta</p>
                  <p className="text-sm font-medium text-text-high">{customer.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-dim rounded-lg"><MapPin className="w-4 h-4 text-text-body" /></div>
                <div>
                  <p className="text-xs text-text-body">Adres</p>
                  <p className="text-sm font-medium text-text-high leading-relaxed">{customer.address || '—'}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-body">Sorumlu</span>
                <span className="font-medium text-text-high">Sorumlu {customer.responsible_user_id}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-text-body">Kayıt Tarihi</span>
                <span className="font-medium text-text-high">{new Date(customer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs / Detailed Sections */}
        <div className="lg:col-span-2 space-y-6">
          <Card noPadding>
            <div className="border-b border-border overflow-x-auto no-scrollbar">
              <nav className="flex p-1 w-max min-w-full">
                {['Aktif İşler', 'Teklifler', 'Teslimat/Servis', 'Şikayet/Talepler', 'Dosyalar', 'Notlar'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-text-body hover:bg-surface-dim'}`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4 sm:p-6">
              {activeTab === 'Aktif İşler' && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-jakarta font-semibold text-text-high">Devam Eden Siparişler</h3>
                  </div>
                  <div className="p-6 text-center text-text-body italic border border-dashed border-border rounded-xl">
                    Bu müşteriye ait aktif iş bulunamadı.
                  </div>
                </>
              )}
              {activeTab === 'Dosyalar' && (
                <div className="-m-6">
                  <FileSection entityType="customer" entityId={parseInt(id || '0')} />
                </div>
              )}
              {activeTab === 'Teklifler' && (
                <div className="p-6 text-center text-text-body italic">Henüz teklif bulunmuyor.</div>
              )}
              {activeTab === 'Teslimat/Servis' && (
                <CustomerDeliveryList 
                  customerId={parseInt(id || '0')} 
                  onSelect={(id) => { setSelectedDeliveryId(id); setIsDeliveryDrawerOpen(true); }} 
                />
              )}
              {activeTab === 'Şikayet/Talepler' && (
                <CustomerRequestList 
                  customerId={parseInt(id || '0')} 
                  onSelect={(id) => { setSelectedRequestId(id); setIsRequestDrawerOpen(true); }} 
                />
              )}
              {activeTab === 'Notlar' && (
                <div className="p-6 text-center text-text-body italic">Henüz not bulunmuyor.</div>
              )}
            </div>
          </Card>

          <CommentsPanel entityType="customer" entityId={parseInt(id || '0')} />

          <Card>
            <CardHeader title="Aktivite Geçmişi" />
            <div className="p-6 text-center text-text-body italic">
              Henüz aktivite kaydı bulunmuyor.
            </div>
          </Card>
        </div>
      </div>

      <DeliveryServiceDetailDrawer
        isOpen={isDeliveryDrawerOpen}
        onClose={() => setIsDeliveryDrawerOpen(false)}
        deliveryId={selectedDeliveryId}
        onUpdate={() => setActiveTab('Teslimat/Servis')}
        onEdit={() => setIsDeliveryModalOpen(true)}
      />

      <DeliveryServiceModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        onSuccess={() => setActiveTab('Teslimat/Servis')}
        customerId={parseInt(id || '0')}
      />

      <RequestTicketDetailDrawer
        isOpen={isRequestDrawerOpen}
        onClose={() => setIsRequestDrawerOpen(false)}
        requestId={selectedRequestId}
        onUpdate={() => setActiveTab('Şikayet/Talepler')}
        onEdit={() => setIsRequestModalOpen(true)}
      />

      <RequestTicketModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => setActiveTab('Şikayet/Talepler')}
        customerId={parseInt(id || '0')}
      />

      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchCustomer}
        customer={customer}
      />
      <GlobalQuickCreateModal
        type={quickCreateType}
        onClose={() => setQuickCreateType(null)}
        initialValues={{ customer_id: customer.id }}
      />
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
