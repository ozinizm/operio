import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const iconMap = {
    danger: { icon: Trash2, bg: 'bg-red-100', color: 'text-red-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
    default: { icon: Info, bg: 'bg-blue-100', color: 'text-blue-600' },
  };
  const { icon: Icon, bg, color } = iconMap[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-text-high/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-modal relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mb-5 mx-auto`}>
            <Icon className={`w-7 h-7 ${color}`} />
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-jakarta font-bold text-text-high mb-2">{title}</h3>
            <div className="text-sm text-text-body leading-relaxed">{description}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            <button
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : variant === 'warning'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for easy confirm dialog management.
 *
 * Usage:
 *   const { confirmProps, confirm } = useConfirm();
 *   // in JSX: <ConfirmDialog {...confirmProps} />
 *   // to open: confirm({ title, description, onConfirm })
 */
export function useConfirm() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirm = (opts: {
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger' | 'warning';
    onConfirm: () => void;
  }) => {
    setState({ ...opts, isOpen: true });
  };

  const close = () => setState(s => ({ ...s, isOpen: false }));

  const confirmProps: ConfirmDialogProps = {
    ...state,
    onCancel: close,
    onConfirm: () => {
      close();
      state.onConfirm();
    },
  };

  return { confirmProps, confirm };
}
