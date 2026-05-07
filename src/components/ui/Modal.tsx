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
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`bg-surface w-full ${sizes[size]} rounded-3xl shadow-modal relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-jakarta font-bold text-text-high">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-dim rounded-full transition-colors">
            <X className="w-5 h-5 text-text-body" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
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
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sideClasses = side === 'right' ? 'right-0 slide-in-from-right' : 'left-0 slide-in-from-left';

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-y-0 ${sideClasses} w-full max-w-md bg-surface shadow-modal z-10 animate-in duration-300`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-jakarta font-bold text-text-high">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-dim rounded-full transition-colors">
            <X className="w-5 h-5 text-text-body" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
