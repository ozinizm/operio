import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastContext, type ToastType } from './ToastContext';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToasts = React.useRef<{ [key: string]: number }>({});

  const showToast = (message: string, type: ToastType = 'success') => {
    // Deduplication logic
    const now = Date.now();
    const key = `${type}:${message}`;
    if (lastToasts.current[key] && now - lastToasts.current[key] < 2000) {
      return;
    }
    lastToasts.current[key] = now;

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:bottom-4 md:right-4 z-[100] flex flex-col gap-2 md:w-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full md:w-auto md:min-w-80 md:max-w-md flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full transition-all bg-surface ${
              toast.type === 'success' ? 'border-emerald-100 text-emerald-800' :
              toast.type === 'error' ? 'border-red-100 text-red-800' :
              toast.type === 'warning' ? 'border-amber-100 text-amber-800' :
              'border-blue-100 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            <span className="text-sm font-medium">
              {typeof toast.message === 'string' ? toast.message : JSON.stringify(toast.message)}
            </span>
            <button aria-label="Bildirimi kapat" title="Kapat" onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="ml-auto flex-shrink-0">
              <X className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
