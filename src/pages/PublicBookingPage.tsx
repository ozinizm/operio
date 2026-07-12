import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Loader2, MapPin, Phone, UserRound } from 'lucide-react';
import { appointmentsApi, type AppointmentService, type AppointmentSettings, type AppointmentStaff } from '../services/appointmentsApi';
import { getErrorMessage } from '../services/apiClient';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100';

export default function PublicBookingPage() {
  const { slug = '' } = useParams();
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [staff, setStaff] = useState<AppointmentStaff[]>([]);
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [staffId, setStaffId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await appointmentsApi.publicConfig(slug);
      setSettings(data.settings);
      setServices(data.services);
      setStaff(data.staff);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Randevu sayfası bulunamadı.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const service = useMemo(() => services.find(item => item.id === serviceId), [services, serviceId]);
  const eligibleStaff = useMemo(() => {
    if (!service) return [];
    const ids = new Set(service.staff_ids || []);
    return staff.filter(item => ids.has(item.id));
  }, [service, staff]);
  const minDate = new Date().toISOString().slice(0, 10);

  const selectService = (value: string) => {
    const nextId = value ? Number(value) : '';
    setServiceId(nextId);
    const selected = services.find(item => item.id === nextId);
    const matching = staff.filter(item => selected?.staff_ids?.includes(item.id));
    setStaffId(matching.length === 1 ? matching[0].id : '');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceId || !date || !time) {
      setError('Hizmet, tarih ve saat seçimi zorunludur.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await appointmentsApi.createPublic(slug, {
        service_id: serviceId,
        staff_id: staffId || null,
        starts_at: new Date(`${date}T${time}:00`).toISOString(),
        ...form,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Randevu oluşturulamadı. Seçtiğiniz saat dolmuş olabilir.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-dvh grid place-items-center bg-slate-50"><div className="flex items-center gap-3 text-slate-600"><Loader2 className="animate-spin" /> Randevu sayfası hazırlanıyor…</div></div>;
  if (!settings) return <div className="min-h-dvh grid place-items-center bg-slate-50 p-5"><div className="max-w-md rounded-3xl border bg-white p-8 text-center"><p className="text-slate-700">{error}</p><button onClick={() => void load()} className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Tekrar dene</button></div></div>;
  if (done) return <div className="min-h-dvh grid place-items-center bg-slate-50 p-5"><div className="max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm md:p-10"><CheckCircle2 className="mx-auto" size={48} style={{ color: settings.accent_color }} /><h1 className="mt-4 text-3xl font-bold text-slate-950">Talebiniz alındı</h1><p className="mt-3 text-slate-600">{settings.success_message}</p></div></div>;

  return (
    <div className="min-h-dvh bg-slate-50 pb-[env(safe-area-inset-bottom)]">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6 md:py-8">
          <div className="text-xs font-bold uppercase tracking-[.22em] text-slate-500">Online Randevu</div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 md:text-4xl">{settings.business_name || 'Randevu Oluştur'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">{settings.headline}</p>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <form onSubmit={submit} className="order-2 space-y-5 rounded-3xl border bg-white p-5 shadow-sm md:p-8 lg:order-1">
          <div><h2 className="text-xl font-bold text-slate-950 md:text-2xl">Randevunuzu oluşturun</h2><p className="mt-1 text-sm text-slate-500">Hizmeti seçin, uygun tarih ve iletişim bilgilerinizi girin.</p></div>
          <label className="block text-sm font-semibold text-slate-700">Hizmet<span className="text-red-500"> *</span><select required value={serviceId} onChange={event => selectService(event.target.value)} className={`${inputClass} mt-2`}><option value="">Hizmet seçin</option>{services.map(item => <option key={item.id} value={item.id}>{item.name} · {item.duration_minutes} dk</option>)}</select></label>
          {service && <label className="block text-sm font-semibold text-slate-700">Uzman<select value={staffId} disabled={eligibleStaff.length <= 1} onChange={event => setStaffId(event.target.value ? Number(event.target.value) : '')} className={`${inputClass} mt-2 disabled:bg-slate-50`}><option value="">Uygun uzmanlardan herhangi biri</option>{eligibleStaff.map(item => <option key={item.id} value={item.id}>{item.name}{item.title ? ` · ${item.title}` : ''}</option>)}</select>{eligibleStaff.length === 0 && <span className="mt-2 block text-xs text-amber-700">Bu hizmet için uzman seçimi gerekmiyor; işletme uygun ekibi yönlendirecek.</span>}</label>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Tarih<span className="text-red-500"> *</span><input required min={minDate} type="date" value={date} onChange={event => setDate(event.target.value)} className={`${inputClass} mt-2`} /></label><label className="text-sm font-semibold text-slate-700">Saat<span className="text-red-500"> *</span><input required type="time" value={time} onChange={event => setTime(event.target.value)} className={`${inputClass} mt-2`} /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><input required aria-label="Ad Soyad" placeholder="Ad Soyad" value={form.customer_name} onChange={event => setForm({ ...form, customer_name: event.target.value })} className={inputClass} /><input required aria-label="Telefon" placeholder="Telefon" value={form.customer_phone} onChange={event => setForm({ ...form, customer_phone: event.target.value })} className={inputClass} /></div>
          <input type="email" aria-label="E-posta" placeholder="E-posta (isteğe bağlı)" value={form.customer_email} onChange={event => setForm({ ...form, customer_email: event.target.value })} className={inputClass} />
          <textarea aria-label="Not" placeholder="Notunuz (isteğe bağlı)" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className={`${inputClass} min-h-24 resize-y`} />
          {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <button disabled={submitting} className="sticky bottom-3 w-full rounded-2xl p-4 font-bold text-white shadow-lg disabled:opacity-60 md:static" style={{ backgroundColor: settings.accent_color }}>{submitting ? 'Randevu oluşturuluyor…' : 'Randevu Talebi Oluştur'}</button>
        </form>
        <aside className="order-1 rounded-3xl border bg-white p-5 shadow-sm lg:order-2 lg:sticky lg:top-6">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Randevu Özeti</div><h3 className="mt-2 text-xl font-bold text-slate-950">{service?.name || 'Hizmet seçin'}</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-600">{service && <><div className="flex items-center gap-3"><Clock size={18} />{service.duration_minutes} dakika</div><div className="text-2xl font-extrabold text-slate-950">{service.price ? `${service.price} ${service.currency}` : 'Fiyat için iletişime geçin'}</div></>}{staffId && <div className="flex items-center gap-3"><UserRound size={18} />{eligibleStaff.find(item => item.id === staffId)?.name}</div>}{settings.address && <div className="flex items-start gap-3"><MapPin className="shrink-0" size={18} />{settings.address}</div>}{settings.phone && <div className="flex items-center gap-3"><Phone size={18} />{settings.phone}</div>}{date && time && <div className="flex items-center gap-3 font-semibold text-slate-900"><CalendarDays size={18} />{new Date(`${date}T${time}`).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}</div>}</div>
        </aside>
      </main>
    </div>
  );
}
