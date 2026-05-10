import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Zap, Lock, 
  Info, Mail, Phone, Clock, MessageSquare, CheckCircle2, XCircle, Loader2, Save
} from 'lucide-react';
import { platformApi } from '../../services/platformApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { UserPasswordResetModal } from '../../components/platform/UserPasswordResetModal';
import { formatDate, formatTime } from '../../utils/formatters';

export default function PlatformSettings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'settings' | 'requests' | 'logs'>('settings');
  const [settings, setSettings] = useState<any>({
    support_email: '',
    support_whatsapp: '',
    support_company_name: '',
    support_working_hours: '',
    support_emergency_note: '',
    platform_name: '',
    platform_footer_text: ''
  });
  const [requests, setRequests] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password Reset Flow for Requests
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<any>(null);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'settings') {
        const data = await platformApi.getSettings();
        // Convert array of {key, value} to object
        const settingsObj: any = {};
        data.forEach((s: any) => {
          settingsObj[s.key] = s.value;
        });
        setSettings((prev: any) => ({ ...prev, ...settingsObj }));
      } else if (activeTab === 'requests') {
        const data = await platformApi.getSupportRequests();
        setRequests(data);
      } else if (activeTab === 'logs') {
        const data = await platformApi.getEmailLogs();
        setLogs(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
      showToast('Veriler yüklenemedi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await platformApi.updateSettings(settings);
      showToast('Sistem ayarları başarıyla güncellendi.', 'success');
    } catch (error) {
      showToast('Ayarlar kaydedilemedi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRequestStatus = async (id: number, status: string) => {
    try {
      await platformApi.updateSupportRequest(id, { status });
      showToast('Talep durumu güncellendi.', 'success');
      fetchData();
    } catch (error) {
      showToast('İşlem başarısız.', 'error');
    }
  };

  const handleInitiateReset = async (requestId: number, email: string) => {
    setIsSearchingUser(true);
    setActiveRequestId(requestId);
    try {
      const userData = await platformApi.searchUserByEmail(email);
      setResettingUser(userData);
      setResetModalOpen(true);
    } catch (error: any) {
      const detail = error.response?.data?.detail || 'Kullanıcı bulunamadı.';
      showToast(detail, 'error');
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleResetConfirm = async (tempPassword: string) => {
    if (!resettingUser || !activeRequestId) return;
    
    try {
      // Find the first workspace (or admin can choose if we implement it later)
      // For now, use the first workspace found for the user
      const workspaceId = resettingUser.workspaces[0]?.id;
      
      if (!workspaceId) {
        showToast('Kullanıcının bağlı olduğu işletme bulunamadı.', 'error');
        return;
      }

      await platformApi.resetUserPassword(workspaceId, resettingUser.id, tempPassword);
      
      // Also update the support request status to resolved
      await platformApi.updateSupportRequest(activeRequestId, { 
        status: 'resolved',
        note: 'Şifre yönetici tarafından sıfırlandı.'
      });
      
      showToast('Şifre sıfırlandı ve talep çözüldü.', 'success');
      fetchData();
    } catch (error) {
      showToast('Şifre sıfırlama işlemi başarısız.', 'error');
      throw error;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4" /> Global Configuration
        </div>
        <h1 className="text-4xl font-jakarta font-extrabold text-slate-800 tracking-tight">Platform Yönetimi</h1>
        <p className="text-slate-500 font-medium">Operio platformuna ait genel yapılandırma, destek bilgileri ve kullanıcı yardım talepleri.</p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'settings' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sistem Ayarları
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'requests' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Şifre Yardım Talepleri
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'logs' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          E-posta Logları
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-50">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-jakarta font-bold text-slate-800">Destek ve İletişim</h3>
                  <p className="text-sm text-slate-500 font-medium">Login ekranındaki destek modalında görünecek bilgiler.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Destek E-postası"
                  icon={<Mail className="w-4 h-4" />}
                  value={settings.support_email}
                  onChange={e => setSettings({ ...settings, support_email: e.target.value })}
                  placeholder="info@operio.dev"
                />
                <Input 
                  label="WhatsApp / Telefon"
                  icon={<Phone className="w-4 h-4" />}
                  value={settings.support_whatsapp}
                  onChange={e => setSettings({ ...settings, support_whatsapp: e.target.value })}
                  placeholder="905XXXXXXXXX"
                />
                <Input 
                  label="Destek Veren Firma"
                  icon={<Settings className="w-4 h-4" />}
                  value={settings.support_company_name}
                  onChange={e => setSettings({ ...settings, support_company_name: e.target.value })}
                  placeholder="Fikir Creative"
                />
                <Input 
                  label="Çalışma Saatleri"
                  icon={<Clock className="w-4 h-4" />}
                  value={settings.support_working_hours}
                  onChange={e => setSettings({ ...settings, support_working_hours: e.target.value })}
                  placeholder="Hafta içi 09:00 - 18:00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Acil Erişim Notu</label>
                <textarea 
                  className="w-full min-h-[100px] p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary text-sm text-slate-600 transition-all outline-none"
                  value={settings.support_emergency_note}
                  onChange={e => setSettings({ ...settings, support_emergency_note: e.target.value })}
                  placeholder="Acil durumlarda yapılacak yönlendirme..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  isLoading={isSaving}
                  className="px-8 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  <Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet
                </Button>
              </div>
            </form>

            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-50">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-jakarta font-bold text-slate-800">Platform Kimliği</h3>
                  <p className="text-sm text-slate-500 font-medium">Sistem genelindeki marka ve footer metinleri.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Platform Adı"
                  value={settings.platform_name}
                  onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                  placeholder="Operio"
                />
                <Input 
                  label="Footer Alt Metni"
                  value={settings.platform_footer_text}
                  onChange={e => setSettings({ ...settings, platform_footer_text: e.target.value })}
                  placeholder="© 2026 Operio."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[32px] text-white space-y-6 relative overflow-hidden shadow-2xl shadow-slate-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary mb-5 backdrop-blur-md border border-white/10">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-jakarta font-extrabold mb-3 tracking-tight">Güvenlik Hatırlatması</h3>
                <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                  Buradaki bilgiler tüm kullanıcıların erişimine açıktır. Lütfen API key, şifre veya hassas verileri bu alanlara girmeyin.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                <Info className="w-4 h-4" /> Sistem Bilgisi
              </div>
              <p className="text-[12px] text-amber-900 font-bold leading-relaxed">
                Ayarlar güncellendiğinde tüm aktif oturumlar için dinamik olarak yenilenecektir. Cache temizliği gerekmez.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'requests' ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm font-bold">Talepler yükleniyor...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 p-12">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                <Lock className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-600">Henüz talep bulunmuyor</p>
                <p className="text-sm font-medium">Kullanıcılar şifremi unuttum dediğinde burada görünecektir.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı / E-posta</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                            {req.email.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{req.email}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Talep ID: #{req.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-bold text-slate-600">
                          {new Date(req.created_at).toLocaleDateString('tr-TR')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(req.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-6">
                        {req.status === 'new' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-amber-50 text-amber-600 border border-amber-100">
                            YENİ TALEP
                          </span>
                        )}
                        {req.status === 'resolved' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-600 border border-emerald-100">
                            ÇÖZÜLDÜ
                          </span>
                        )}
                        {req.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-slate-100 text-slate-500">
                            İPTAL EDİLDİ
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        {req.status === 'new' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 rounded-lg bg-indigo-50 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-100"
                              onClick={() => handleInitiateReset(req.id, req.email)}
                              isLoading={isSearchingUser && activeRequestId === req.id}
                            >
                              <Lock className="w-4 h-4 mr-2" /> Şifre Sıfırla
                            </Button>
                            <button 
                              onClick={() => handleUpdateRequestStatus(req.id, 'resolved')}
                              className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                              title="Sadece Çözüldü İşaretle"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleUpdateRequestStatus(req.id, 'cancelled')}
                              className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                              title="İptal Et"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-300 italic">İşlem Tamamlandı</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm font-bold">Loglar yükleniyor...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 p-12">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                <Mail className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-600">Henüz e-posta logu bulunmuyor</p>
                <p className="text-sm font-medium">Sistem tarafından gönderilen e-postalar burada listelenecektir.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alıcı / Konu</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Template / Key</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{log.recipient_email}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{log.subject}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight border border-slate-200">
                          {{
                            'task_assigned': 'Görev Atama',
                            'task_status_changed': 'Görev Durumu Güncelleme',
                            'team_member_created': 'Yeni Personel',
                            'team_member_password_reset': 'Personel Şifre Sıfırlama',
                            'welcome_workspace_admin': 'Yeni İşletme Sahibi',
                            'password_reset_by_admin': 'Şifre Sıfırlama',
                            'forgot_password_request_admin_notice': 'Şifre Talebi (Admin)',
                            'support_request_received_user_notice': 'Talep Alındı',
                          }[log.template_key as string] || log.template_key || 'CUSTOM'}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-bold text-slate-600">
                          {formatDate(log.created_at, 'dd.MM.yyyy')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatTime(log.created_at)}
                        </p>
                      </td>
                      <td className="p-6">
                        {log.status === 'sent' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-600 border border-emerald-100">
                            GÖNDERİLDİ
                          </span>
                        )}
                        {log.status === 'skipped' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-slate-100 text-slate-500">
                            ATLADI (SMTP KAPALI)
                          </span>
                        )}
                        {log.status === 'failed' && (
                          <div className="group relative inline-block">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-rose-50 text-rose-600 border border-rose-100 cursor-help">
                              HATA OLUŞTU
                            </span>
                            {log.error_message && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {log.error_message}
                              </div>
                            )}
                          </div>
                        )}
                        {log.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-amber-50 text-amber-600 animate-pulse">
                            BEKLİYOR
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {resetModalOpen && resettingUser && (
        <UserPasswordResetModal 
          isOpen={resetModalOpen}
          onClose={() => {
            setResetModalOpen(false);
            setResettingUser(null);
            setActiveRequestId(null);
          }}
          onConfirm={handleResetConfirm}
          userEmail={resettingUser.email}
          userName={resettingUser.full_name || resettingUser.email}
        />
      )}
    </div>
  );
}
