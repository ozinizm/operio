import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Phone, Mail, MapPin, 
  ChevronLeft, MoreHorizontal, User
} from 'lucide-react';
import { customersApi } from '../services/customersApi';
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


export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Aktif İşler');
  
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [isDeliveryDrawerOpen, setIsDeliveryDrawerOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);


  useEffect(() => {
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
    fetchCustomer();
  }, [id]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="p-2 hover:bg-surface-dim rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-jakarta font-bold text-text-high">{customer.name}</h1>
              {getStatusBadge(customer.status)}
            </div>
            <p className="text-text-body mt-1">{customer.sector || 'Sektör Belirtilmedi'} • Kurumsal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EntityWatchButton entityType="customer" entityId={parseInt(id || '0')} />
          <Button variant="outline">Düzenle</Button>
          <Button>Yeni İş Oluştur</Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info & Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader title="İletişim Bilgileri" action={<MoreHorizontal className="w-5 h-5 text-text-body" />} />
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
            <div className="border-b border-border">
              <nav className="flex p-1">
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
            <div className="p-6">
              {activeTab === 'Aktif İşler' && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-jakarta font-semibold text-text-high">Devam Eden Siparişler</h3>
                    <Button variant="ghost" size="sm">Tümünü Gör</Button>
                  </div>
                  <div className="p-10 text-center text-text-body italic border border-dashed border-border rounded-xl">
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
                <div className="p-10 text-center text-text-body italic">Henüz teklif bulunmuyor.</div>
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
                <div className="p-10 text-center text-text-body italic">Henüz not bulunmuyor.</div>
              )}
            </div>
          </Card>

          <CommentsPanel entityType="customer" entityId={parseInt(id || '0')} />

          <Card>
            <CardHeader title="Aktivite Geçmişi" action={<Button variant="ghost" size="sm">Not Ekle</Button>} />
            <div className="p-10 text-center text-text-body italic">
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
    </div>
  );
}
