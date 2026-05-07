import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-border p-8 lg:p-12 text-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-jakarta font-extrabold text-text-high tracking-tight">
                Bir Hata Oluştu
              </h1>
              <p className="text-text-body text-base leading-relaxed">
                Uygulama beklenmedik bir durumla karşılaştı. Sayfa güvenli moda alındı.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-surface-dim p-4 rounded-2xl text-left overflow-auto max-h-40 no-scrollbar">
                <p className="text-[10px] font-mono text-red-600 break-all uppercase font-bold mb-1 opacity-50">Hata Detayı (Geliştirici Modu)</p>
                <code className="text-[11px] font-mono text-text-high">{this.state.error.toString()}</code>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full py-6 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Sayfayı Yenile
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-6 rounded-2xl font-bold border-border hover:bg-surface-dim flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Ana Sayfaya Dön
              </Button>
            </div>
            
            <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-widest">
              OPERIO GÜVENLİ MOD
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
