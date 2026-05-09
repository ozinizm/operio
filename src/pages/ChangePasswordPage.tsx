import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authApi } from '../services/authApi';
import { useToast } from '../components/ui/Toast';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clearAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== newPasswordConfirm) {
      showToast('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('Yeni şifre mevcut şifre ile aynı olamaz.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      });
      
      // 1. Clear all auth state via central context function
      clearAuth();
      
      showToast('Şifreniz başarıyla güncellendi.', 'success');
      
      // 2. Redirect with multiple layers for robustness
      const loginUrl = '/login?passwordChanged=1';
      
      // Try React Router navigate first
      navigate(loginUrl, { replace: true });
      
      // Safety fallback: Force absolute redirect after a small delay 
      // if for some reason React Router didn't trigger
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          console.log('React Router navigate failed or was delayed, using window.location.replace fallback');
          window.location.replace(loginUrl);
        }
      }, 500);
    } catch (error: any) {
      showToast(error.message || 'Şifre değiştirilemedi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full -ml-64 -mb-64 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-8 scale-110" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4">
            <Lock className="w-3.5 h-3.5" /> Güvenlik Protokolü
          </div>

          <h1 className="text-3xl font-jakarta font-black text-slate-900 tracking-tight mb-3">Hesabınızı Güvenceye Alın</h1>
          <p className="text-slate-500 font-medium text-sm max-w-[280px] leading-relaxed mx-auto">
            Sisteme ilk girişiniz olduğu için şifrenizi güncellemeniz gerekmektedir.
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[48px] shadow-2xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <Input 
                label="Mevcut (Geçici) Şifre" 
                type="password" 
                placeholder="Size iletilen şifreyi girin" 
                icon={<Lock className="w-4 h-4" />}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-slate-50/50 border-slate-100"
              />

              <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent my-2" />

              <Input 
                label="Yeni Güçlü Şifre" 
                type="password" 
                placeholder="••••••••" 
                icon={<ShieldCheck className="w-4 h-4" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-slate-50/50 border-slate-100"
              />

              <Input 
                label="Yeni Şifre Tekrar" 
                type="password" 
                placeholder="••••••••" 
                icon={<ShieldCheck className="w-4 h-4" />}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-slate-50/50 border-slate-100"
              />
            </div>

            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Şifre Güvenlik Kriterleri</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <RequirementItem text="Min. 8 karakter" met={newPassword.length >= 8} />
                <RequirementItem text="Büyük/Küçük" met={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)} />
                <RequirementItem text="Rakam" met={/[0-9]/.test(newPassword)} />
                <RequirementItem text="Özel Karakter" met={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)} />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-[24px] bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Güncelleniyor...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Şifreyi Kaydet</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-10 text-[11px] text-slate-400 font-medium">
          Operio Güvenlik Altyapısı © 2026
        </p>
      </div>
    </div>
  );
}

function RequirementItem({ text, met }: { text: string; met: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${met ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
      <CheckCircle2 className={`w-3 h-3 ${met ? 'opacity-100' : 'opacity-30'}`} />
      <span>{text}</span>
    </div>
  );
}
