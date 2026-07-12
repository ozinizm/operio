import { useState } from 'react';
import { UserPlus, Copy, Check, X, CheckCircle2, User, Mail, Shield, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/ToastContext';
import type { WorkspaceUserInput } from '../../services/platformApi';

interface PlatformUserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userData: WorkspaceUserInput) => Promise<void>;
}

type ModalStep = 'form' | 'result';

export function PlatformUserCreateModal({
  isOpen,
  onClose,
  onConfirm
}: PlatformUserCreateModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<ModalStep>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [formData, setFormData] = useState(() => ({
    full_name: '',
    email: '',
    password: Math.random().toString(36).slice(-10),
    role: 'staff',
    is_active: true
  }));

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setIsCopied(true);
      showToast('Şifre kopyalandı.', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('Kopyalama başarısız oldu.', 'error');
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      showToast('Lütfen tüm alanları doldurun.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(formData);
      setStep('result');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      full_name: '',
      email: '',
      password: Math.random().toString(36).slice(-10),
      role: 'staff',
      is_active: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step === 'form' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {step === 'form' ? <UserPlus className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleConfirm}>
              <div className="mb-8">
                <h3 className="text-2xl font-jakarta font-bold text-slate-800 mb-2">Yeni Kullanıcı Oluştur</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  İşletme için yeni bir personel hesabı tanımlayın. Kullanıcıya geçici şifresi iletilecektir.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Örn: Ahmet Yılmaz"
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      className="pl-10 h-12 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-posta Adresi</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email"
                      placeholder="eposta@isletme.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="pl-10 h-12 rounded-xl border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Rol</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="staff">Personel</option>
                        <option value="admin">Yönetici</option>
                        <option value="owner">İşletme Sahibi</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Geçici Şifre</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="pl-10 h-12 rounded-xl border-slate-200"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-2xl font-jakarta font-bold text-slate-800 mb-2">Hesap Oluşturuldu</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Kullanıcı başarıyla oluşturuldu ve işletmeye bağlandı. Lütfen aşağıdaki giriş bilgilerini kullanıcıya iletin.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">E-posta</p>
                  <p className="text-sm font-bold text-slate-700">{formData.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Geçici Şifre</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white border border-slate-200 h-12 rounded-xl flex items-center px-4 font-mono font-bold text-lg text-indigo-600 tracking-wider">
                      {formData.password}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`h-12 w-12 rounded-xl flex items-center justify-center p-0 transition-all ${isCopied ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      onClick={handleCopy}
                    >
                      {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl"
                onClick={handleClose}
              >
                Kapat
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
