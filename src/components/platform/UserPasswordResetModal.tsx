import { useState } from 'react';
import { ShieldAlert, Copy, Check, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface UserPasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tempPassword: string) => Promise<void>;
  userEmail: string;
  userName: string;
}

type ModalStep = 'confirm' | 'result';

export function UserPasswordResetModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  userName
}: UserPasswordResetModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<ModalStep>('confirm');
  const [tempPassword] = useState(() => Math.random().toString(36).slice(-8));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setIsCopied(true);
      showToast('Geçici şifre kopyalandı.', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      showToast('Kopyalama başarısız oldu.', 'error');
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(tempPassword);
      setStep('result');
    } catch (error) {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
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
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step === 'confirm' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {step === 'confirm' ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'confirm' ? (
            <>
              <div className="mb-8">
                <h3 className="text-xl font-jakarta font-bold text-slate-800 mb-2">Şifre Sıfırla</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">{userName}</span> ({userEmail}) kullanıcısı için yeni bir geçici şifre oluşturulacaktır. Kullanıcı bir sonraki girişinde şifresini değiştirmeye zorlanacaktır.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 font-bold"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-jakarta font-bold text-slate-800 mb-2">Şifre Sıfırlandı</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Geçici şifre başarıyla oluşturuldu. Lütfen aşağıdaki şifreyi kullanıcıya güvenli bir şekilde iletin.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Geçici Şifre</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-slate-200 h-12 rounded-xl flex items-center px-4 font-mono font-bold text-lg text-indigo-600 tracking-wider">
                    {tempPassword}
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

              <Button 
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
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
