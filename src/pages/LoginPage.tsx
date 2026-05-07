import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, Loader2 } from 'lucide-react';
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, isLoading, user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, skip login page
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.is_super_admin) {
        navigate('/platform', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      // 1. Get token from backend
      const data = await authApi.login(formData);
      const token = data.access_token;

      // 2. Save token so apiClient can use it for the /me call
      localStorage.setItem('token', token);

      // 3. Fetch user/workspace/role with the new token
      const meData = await authApi.me();

      // 4. Commit all auth state synchronously — ProtectedRoute will see
      //    isAuthenticated === true before navigate() causes a re-render
      setAuth(token, meData.user, meData.workspace, meData.role);

      showToast('Başarıyla giriş yapıldı', 'success');
      
      // Super Admin goes to /platform, others go to /dashboard
      if (meData.user.is_super_admin) {
        navigate('/platform', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      showToast(error.response?.data?.detail || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 mb-6">
            <span className="text-3xl font-jakarta font-bold">O</span>
          </div>
          <h1 className="text-3xl font-jakarta font-bold text-text-high">Operio</h1>
          <p className="text-text-body mt-2">Modüler İşletme Yönetim Platformu</p>
          <p className="text-[10px] font-bold text-primary uppercase mt-3 tracking-widest">Fikir Creative tarafından geliştirildi</p>
        </div>

        <div className="bg-surface border border-border p-8 rounded-3xl shadow-soft">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label="E-posta" 
              type="email" 
              placeholder="ornek@sirket.com" 
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text-high">Şifre</label>
                <button type="button" className="text-xs text-primary font-bold hover:underline">Şifremi Unuttum</button>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Giriş Yap <ChevronRight className="w-5 h-5 ml-2" /></>}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-xs text-text-body">
              Hesabınız yok mu? <button className="text-primary font-bold hover:underline">Destek ile iletişime geçin</button>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-text-body opacity-60">
          © 2026 Operio. Fikir Creative tarafından geliştirilmiştir. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
