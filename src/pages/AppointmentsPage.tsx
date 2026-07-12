import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Copy, ExternalLink, Plus, Save, Settings2, Users, Pencil, Trash } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirm } from '../components/ui/useConfirm';
import { appointmentsApi, type Appointment, type AppointmentService, type AppointmentStaff, type AppointmentSettings } from '../services/appointmentsApi';

const defaultSettings: AppointmentSettings = {
  is_public_enabled: false,
  public_slug: '',
  business_name: '',
  headline: 'Online randevunuzu oluşturun',
  description: 'Size uygun hizmeti ve saati seçin.',
  accent_color: '#E11D48',
  timezone: 'Europe/Istanbul',
  slot_interval_minutes: 30,
  min_notice_hours: 2,
  max_advance_days: 60,
  require_approval: true,
  success_message: 'Randevu talebiniz alınmıştır.'
};

export default function AppointmentsPage() {
  const [tab, setTab] = useState<'appointments' | 'services' | 'staff' | 'landing'>('appointments');
  const [settings, setSettings] = useState<AppointmentSettings>(defaultSettings);
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [staff, setStaff] = useState<AppointmentStaff[]>([]);
  const [items, setItems] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(true);

  // Modals state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AppointmentService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: '',
    currency: 'TRY',
    is_active: true,
    staff_ids: [] as number[],
  });

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<AppointmentStaff | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    is_active: true
  });

  const { confirmProps, confirm } = useConfirm();

  const load = async () => {
    setBusy(true);
    try {
      const [a, b, c, d] = await Promise.all([
        appointmentsApi.getSettings(),
        appointmentsApi.listServices(),
        appointmentsApi.listStaff(),
        appointmentsApi.listAppointments()
      ]);
      setSettings(a || defaultSettings);
      setServices(b || []);
      setStaff(c || []);
      setItems(d || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void Promise.all([
      appointmentsApi.getSettings(), appointmentsApi.listServices(), appointmentsApi.listStaff(), appointmentsApi.listAppointments()
    ]).then(([a, b, c, d]) => {
      setSettings(a || defaultSettings); setServices(b || []); setStaff(c || []); setItems(d || []);
    }).catch(console.error).finally(() => setBusy(false));
  }, []);

  const publicUrl = useMemo(() => `${window.location.origin}/book/${settings.public_slug || 'isletme'}`, [settings.public_slug]);

  const saveSettings = async () => {
    try {
      const updated = await appointmentsApi.updateSettings(settings);
      setSettings(updated);
      alert('Randevu ayarları kaydedildi.');
    } catch {
      alert('Ayarlar kaydedilirken hata oluştu.');
    }
  };

  // Service CRUD
  const openServiceModal = (service: AppointmentService | null = null) => {
    if (service) {
      setSelectedService(service);
      setServiceForm({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price ? String(service.price) : '',
        currency: service.currency || 'TRY',
        is_active: service.is_active,
        staff_ids: service.staff_ids || [],
      });
    } else {
      setSelectedService(null);
      setServiceForm({
        name: '',
        description: '',
        duration_minutes: 30,
        price: '',
        currency: 'TRY',
        is_active: true,
        staff_ids: [],
      });
    }
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: serviceForm.name,
        description: serviceForm.description,
        duration_minutes: Number(serviceForm.duration_minutes),
        price: serviceForm.price ? Number(serviceForm.price) : null,
        currency: serviceForm.currency,
        is_active: serviceForm.is_active,
        sort_order: selectedService ? selectedService.sort_order : services.length,
        staff_ids: serviceForm.staff_ids,
      };

      if (selectedService) {
        await appointmentsApi.updateService(selectedService.id, payload);
      } else {
        await appointmentsApi.createService(payload);
      }
      setServiceModalOpen(false);
      await load();
    } catch {
      alert('Hizmet kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteService = (id: number, name: string) => {
    confirm({
      title: 'Hizmeti Sil',
      description: `"${name}" hizmetini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await appointmentsApi.deleteService(id);
          await load();
        } catch {
          alert('Hizmet silinirken hata oluştu.');
        }
      }
    });
  };

  // Staff CRUD
  const openStaffModal = (member: AppointmentStaff | null = null) => {
    if (member) {
      setSelectedStaff(member);
      setStaffForm({
        name: member.name,
        title: member.title || '',
        email: member.email || '',
        phone: member.phone || '',
        is_active: member.is_active
      });
    } else {
      setSelectedStaff(null);
      setStaffForm({
        name: '',
        title: '',
        email: '',
        phone: '',
        is_active: true
      });
    }
    setStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: staffForm.name,
        title: staffForm.title,
        email: staffForm.email,
        phone: staffForm.phone,
        photo_url: selectedStaff?.photo_url || '',
        is_active: staffForm.is_active
      };

      if (selectedStaff) {
        await appointmentsApi.updateStaff(selectedStaff.id, payload);
      } else {
        await appointmentsApi.createStaff(payload);
      }
      setStaffModalOpen(false);
      await load();
    } catch {
      alert('Personel kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteStaff = (id: number, name: string) => {
    confirm({
      title: 'Personeli Sil',
      description: `"${name}" personelini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await appointmentsApi.deleteStaff(id);
          await load();
        } catch {
          alert('Personel silinirken hata oluştu.');
        }
      }
    });
  };

  if (busy) return <div className="p-8">Randevu modülü hazırlanıyor...</div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <CalendarDays size={17} /> Randevu Modülü
          </div>
          <h1 className="text-4xl font-extrabold text-text-high mt-1">Online Randevu</h1>
          <p className="text-text-body mt-2">Randevu sayfanızı, hizmetlerinizi, ekibinizi ve gelen talepleri yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(publicUrl)}>
            <Copy size={16} /> Bağlantıyı Kopyala
          </Button>
          <Button onClick={() => window.open(publicUrl, '_blank')}>
            <ExternalLink size={16} /> Sayfayı Aç
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white border border-border rounded-2xl p-2">
        {([
          ['appointments', 'Randevular'],
          ['services', 'Hizmetler'],
          ['staff', 'Personeller'],
          ['landing', 'Landing Ayarları']
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              tab === k ? 'bg-primary text-white' : 'text-text-body hover:bg-surface-dim'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <div className="bg-white border border-border rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-border font-bold">Son Randevular</div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-text-body">Henüz randevu yok.</div>
          ) : (
            items.map(x => (
              <div key={x.id} className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-bold">{x.customer_name}</div>
                  <div className="text-sm text-text-body">
                    {new Date(x.starts_at).toLocaleString('tr-TR')} · {x.customer_phone}
                  </div>
                </div>
                <select
                  value={x.status}
                  onChange={async e => {
                    await appointmentsApi.updateStatus(x.id, e.target.value);
                    await load();
                  }}
                  className="border rounded-xl px-3 py-2"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                  <option value="no_show">Gelmedi</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openServiceModal(null)}>
              <Plus size={16} /> Hizmet Ekle
            </Button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.id} className="bg-white border border-border rounded-3xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-lg">{s.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'}`}>
                      {s.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <p className="text-sm text-text-body mt-2 min-h-10">{s.description || 'Açıklama belirtilmedi.'}</p>
                  <div className="text-sm font-semibold text-text-high mt-4">
                    {s.duration_minutes} dk · {s.price ? `${s.price} ${s.currency}` : 'Fiyat belirtilmedi'}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/50">
                  <button onClick={() => openServiceModal(s)} className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors" title="Düzenle">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDeleteService(s.id, s.name)} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors" title="Sil">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openStaffModal(null)}>
              <Plus size={16} /> Personel Ekle
            </Button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {staff.map(s => (
              <div key={s.id} className="bg-white border border-border rounded-3xl p-5 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {s.name}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {s.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div className="text-sm text-text-body">{s.title || 'Ekip üyesi'}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/50">
                  <button onClick={() => openStaffModal(s)} className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors" title="Düzenle">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDeleteStaff(s.id, s.name)} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors" title="Sil">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'landing' && (
        <div className="grid xl:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white border border-border rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Settings2 size={20} /> Randevu Sayfası Ayarları
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.is_public_enabled}
                onChange={e => setSettings({ ...settings, is_public_enabled: e.target.checked })}
              />
              <span>Randevu sayfasını yayına al</span>
            </label>
            <Input
              label="İşletme Adı"
              value={settings.business_name || ''}
              onChange={e => setSettings({ ...settings, business_name: e.target.value })}
            />
            <Input
              label="Randevu Linki"
              value={settings.public_slug || ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  public_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                })
              }
            />
            <Input label="Başlık" value={settings.headline} onChange={e => setSettings({ ...settings, headline: e.target.value })} />
            <Input
              label="Açıklama"
              value={settings.description || ''}
              onChange={e => setSettings({ ...settings, description: e.target.value })}
            />
            <Input label="WhatsApp" value={settings.whatsapp || ''} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} />
            <Input label="Adres" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} />
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Slot (dk)"
                type="number"
                value={settings.slot_interval_minutes}
                onChange={e => setSettings({ ...settings, slot_interval_minutes: Number(e.target.value) })}
              />
              <Input
                label="Minimum Bildirim (saat)"
                type="number"
                value={settings.min_notice_hours}
                onChange={e => setSettings({ ...settings, min_notice_hours: Number(e.target.value) })}
              />
              <Input
                label="Maksimum Gün"
                type="number"
                value={settings.max_advance_days}
                onChange={e => setSettings({ ...settings, max_advance_days: Number(e.target.value) })}
              />
            </div>
            <Button onClick={saveSettings}>
              <Save size={16} /> Ayarları Kaydet
            </Button>
          </div>
          <div className="bg-slate-950 text-white rounded-3xl p-6 h-fit">
            <div className="text-xs uppercase tracking-widest text-white/50">Canlı bağlantı</div>
            <div className="font-bold mt-2 break-all">{publicUrl}</div>
            <div className="mt-6 flex items-center gap-2 text-sm">
              <Check size={16} /> Instagram, Google ve web sitenizde kullanabilirsiniz.
            </div>
          </div>
        </div>
      )}

      {/* Service Add/Edit Modal */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title={selectedService ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
      >
        <form onSubmit={handleSaveService} className="space-y-4">
          <Input
            label="Hizmet Adı"
            required
            value={serviceForm.name}
            onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
          />
          <Input
            label="Açıklama"
            value={serviceForm.description}
            onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Süre (Dakika)"
              type="number"
              required
              min={5}
              value={serviceForm.duration_minutes}
              onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
            />
            <Input
              label="Fiyat"
              type="number"
              min={0}
              value={serviceForm.price}
              onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
            />
          </div>
          <fieldset className="rounded-2xl border border-border p-4">
            <legend className="px-2 text-sm font-bold text-text-high">Bu hizmeti verebilen uzmanlar</legend>
            {staff.length === 0 ? <p className="text-sm text-text-body">Önce personel ekleyin.</p> : (
              <div className="grid gap-2 sm:grid-cols-2">
                {staff.filter(member => member.is_active).map(member => (
                  <label key={member.id} className="flex items-center gap-2 rounded-xl p-2 hover:bg-surface-dim">
                    <input
                      type="checkbox"
                      checked={serviceForm.staff_ids.includes(member.id)}
                      onChange={event => setServiceForm(prev => ({
                        ...prev,
                        staff_ids: event.target.checked
                          ? [...prev.staff_ids, member.id]
                          : prev.staff_ids.filter(id => id !== member.id),
                      }))}
                    />
                    <span className="text-sm font-semibold">{member.name}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-bold text-text-high">
              Para Birimi
              <select
                value={serviceForm.currency}
                onChange={e => setServiceForm({ ...serviceForm, currency: e.target.value })}
                className="mt-1 block w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="TRY">TRY ₺</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={serviceForm.is_active}
                onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
              />
              <span className="text-sm font-bold">Aktif</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setServiceModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </Modal>

      {/* Staff Add/Edit Modal */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title={selectedStaff ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <Input
            label="Personel Adı"
            required
            value={staffForm.name}
            onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
          />
          <Input
            label="Unvan / Rol"
            value={staffForm.title}
            onChange={e => setStaffForm({ ...staffForm, title: e.target.value })}
          />
          <Input
            label="E-posta"
            type="email"
            value={staffForm.email}
            onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
          />
          <Input
            label="Telefon"
            value={staffForm.phone}
            onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
          />
          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={staffForm.is_active}
              onChange={e => setStaffForm({ ...staffForm, is_active: e.target.checked })}
            />
            <span className="text-sm font-bold">Aktif</span>
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setStaffModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
