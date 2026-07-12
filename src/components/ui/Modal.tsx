import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto max-[430px]:items-end max-[430px]:p-0" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`bg-surface w-full ${sizes[size]} max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] rounded-3xl shadow-modal relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-[430px]:max-w-none max-[430px]:max-h-[calc(100dvh-env(safe-area-inset-top))] max-[430px]:rounded-b-none max-[430px]:rounded-t-3xl`}>
        <div className="sticky top-0 z-10 bg-surface flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="min-w-0 text-lg sm:text-xl font-jakarta font-bold text-text-high break-words">{title}</h3>
          <button onClick={onClose} aria-label="Kapat" title="Kapat" className="p-2 hover:bg-surface-dim rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary">
            <X className="w-5 h-5 text-text-body" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DrawerProps extends ModalProps {
  side?: 'right' | 'left';
}

export function Drawer({ isOpen, onClose, title, children, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = side === 'right' ? 'right-0 slide-in-from-right' : 'left-0 slide-in-from-left';

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-y-0 ${sideClasses} w-[min(100vw,28rem)] bg-surface shadow-modal z-10 animate-in duration-300 flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-jakarta font-bold text-text-high">{title}</h3>
          <button onClick={onClose} aria-label="Kapat" title="Kapat" className="p-2 hover:bg-surface-dim rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary">
            <X className="w-5 h-5 text-text-body" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
