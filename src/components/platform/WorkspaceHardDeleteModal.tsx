import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface WorkspaceHardDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmSlug: string, backupConfirmed: boolean) => Promise<void>;
  workspaceName: string;
  workspaceSlug: string;
  workspaceStatus: string;
  isDeleting: boolean;
}

export const WorkspaceHardDeleteModal: React.FC<WorkspaceHardDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  workspaceName,
  workspaceSlug,
  workspaceStatus,
  isDeleting
}) => {
  const [confirmSlug, setConfirmSlug] = useState('');
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  if (!isOpen) return null;

  const isArchived = workspaceStatus === 'archived';
  const isSlugValid = confirmSlug === workspaceSlug;
  const canDelete = isArchived && isSlugValid && backupConfirmed && !isDeleting;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-red-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-50 px-8 py-6 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-2xl text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-jakarta font-bold text-red-950">İşletmeyi Kalıcı Olarak Sil</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-xl transition-colors text-red-400 hover:text-red-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-red-900 leading-relaxed">
                DİKKAT: Bu işlem GERİ ALINAMAZ.
              </p>
              <p className="text-xs text-red-700/80 leading-relaxed">
                '<strong>{workspaceName}</strong>' ({workspaceSlug}) işletmesine ait tüm veriler (müşteriler, işler, teklifler, finansal kayıtlar vb.) sistemden kalıcı olarak silinecektir.
              </p>
            </div>
          </div>

          {!isArchived && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-xs font-bold text-amber-800">
                Kalıcı silme işlemi için işletme önce arşivlenmelidir.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                ONAYLAMAK İÇİN İŞLETME SLUG'INI YAZIN
              </label>
              <Input
                placeholder={workspaceSlug}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                className={`rounded-2xl border-2 transition-all ${
                  isSlugValid ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 focus:border-red-500'
                }`}
                disabled={isDeleting}
              />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
              <input 
                type="checkbox" 
                checked={backupConfirmed}
                onChange={(e) => setBackupConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-200 text-red-600 focus:ring-red-500 transition-all cursor-pointer"
                disabled={isDeleting}
              />
              <span className="text-xs font-medium text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                Bu işletmenin yedeğini aldığımı ve bu işlemin geri alınamaz olduğunu onaylıyorum.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-6 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl px-6 font-bold text-slate-500 hover:bg-white hover:text-slate-800"
            disabled={isDeleting}
          >
            Vazgeç
          </Button>
          <button 
            className={`rounded-xl px-8 h-12 flex items-center justify-center font-jakarta font-bold transition-all shadow-xl ${
              canDelete 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
            onClick={() => onConfirm(confirmSlug, backupConfirmed)}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <><Trash2 className="w-4 h-4 mr-2" /> İşletmeyi Tamamen Sil</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
