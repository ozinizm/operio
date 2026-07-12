import { useState, type ReactNode } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean; title: string; description: ReactNode; confirmLabel?: string; cancelLabel?: string;
    variant?: 'default' | 'danger' | 'warning'; onConfirm: () => void;
  }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });

  const confirm = (opts: Omit<typeof state, 'isOpen'>) => setState({ ...opts, isOpen: true });
  const close = () => setState(current => ({ ...current, isOpen: false }));
  const confirmProps: ConfirmDialogProps = {
    ...state,
    onCancel: close,
    onConfirm: () => { close(); state.onConfirm(); },
  };
  return { confirmProps, confirm };
}
