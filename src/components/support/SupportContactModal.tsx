import { useState, useEffect } from 'react';
import { MessageCircle, Mail, Clock, ShieldAlert, X, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { authApi } from '../../services/authApi';

interface SupportContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportContactModal({ isOpen, onClose }: SupportContactModalProps) {
  const [settings, setSettings] = useState<any>({
    support_email: 'info@fikircreative.com',
    support_whatsapp: '',
    support_company_name: 'Fikir Creative',
    support_working_hours: 'Hafta içi 10:00 - 18:00',
    support_emergency_note: 'Acil erişim sorunlarında işletme yöneticiniz veya platform yöneticinizle iletişime geçin.',
    platform_name: 'Operio'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        setIsLoading(true);
        try {
          const data = await authApi.getPublicSettings();
          setSettings(data);
        } catch (error) {
          console.error('Failed to fetch public settings:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <MessageCircle className="w-8 h-8" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-jakarta font-bold text-slate-800 mb-2">{settings.platform_name} Destek</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Giriş, şifre veya hesap erişimiyle ilgili destek almak için {settings.support_company_name} ekibiyle iletişime geçebilirsiniz.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-posta</p>
                <p className="text-sm font-bold text-slate-700">{settings.support_email}</p>
              </div>
              <a 
                href={`mailto:${settings.support_email}`}
                className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {settings.support_whatsapp && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp / Canlı Destek</p>
                  <p className="text-sm font-bold text-slate-700">Hızlı Yanıt Sistemi</p>
                </div>
                <a 
                  href={`https://wa.me/${settings.support_whatsapp.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Çalışma Saatleri</p>
                <p className="text-sm font-bold text-slate-700">{settings.support_working_hours}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 mb-8">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              {settings.support_emergency_note}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
              onClick={() => window.location.href = `mailto:${settings.support_email}`}
              isLoading={isLoading}
            >
              E-posta Gönder
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600"
              onClick={onClose}
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
