import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, CheckCircle2, X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authApi } from '../../services/authApi';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupportClick: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose, onSupportClick }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await authApi.forgotPassword(email);
    } catch (error) {
      console.error('Password reset request error:', error);
      // We still show success to user for security (no enumeration)
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setEmail('');
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleReset}
      />
      
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Lock className="w-8 h-8" />
            </div>
            <button 
              onClick={handleReset}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <h3 className="text-2xl font-jakarta font-bold text-slate-800 mb-2">Şifremi Unuttum</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Hesabınıza bağlı e-posta adresinizi girin. Size yardımcı olabilmemiz için bir talep oluşturacağız.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input 
                  label="E-posta Adresi"
                  type="email"
                  placeholder="ornek@sirket.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'İstek Gönderiliyor...' : <>İstek Gönder <ChevronRight className="w-5 h-5 ml-2" /></>}
                </Button>

                <button 
                  type="button"
                  onClick={onSupportClick}
                  className="w-full text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Destek Ekibine Yaz
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-jakarta font-bold text-slate-800 mb-4">Talep Alındı</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Şifre sıfırlama talebiniz başarıyla alındı. Hesabınız doğrulandıktan sonra işletme yöneticiniz veya Operio destek ekibi sizinle iletişime geçecektir.
              </p>
              
              <div className="space-y-3">
                <Button 
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                  onClick={handleReset}
                >
                  Giriş Ekranına Dön
                </Button>
                <button 
                  onClick={onSupportClick}
                  className="flex items-center justify-center gap-2 w-full text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Yardıma mı ihtiyacınız var?
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
