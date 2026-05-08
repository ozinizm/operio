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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-6" />
          <h1 className="text-2xl font-jakarta font-bold text-slate-800">Şifre Değiştir</h1>
          <p className="text-slate-500 mt-2 text-sm">Güvenliğiniz için geçici şifrenizi değiştirmeniz gerekiyor.</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Mevcut Şifre" 
              type="password" 
              placeholder="••••••••" 
              icon={<Lock className="w-4 h-4" />}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <div className="h-px bg-slate-100 my-2" />

            <Input 
              label="Yeni Şifre" 
              type="password" 
              placeholder="••••••••" 
              icon={<ShieldCheck className="w-4 h-4" />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
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
            />

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Şifre Gereksinimleri</p>
              <div className="grid grid-cols-2 gap-2">
                <RequirementItem text="En az 8 karakter" met={newPassword.length >= 8} />
                <RequirementItem text="Büyük/Küçük harf" met={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)} />
                <RequirementItem text="Rakam içerikli" met={/[0-9]/.test(newPassword)} />
                <RequirementItem text="Özel karakter" met={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)} />
              </div>
            </div>

            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Şifreyi Güncelle <ChevronRight className="w-5 h-5 ml-2" /></>}
            </Button>
          </form>
        </div>
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
