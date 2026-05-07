import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  File, Download, Trash2, 
  FileText, Image as ImageIcon, Plus, 
  Loader2
} from 'lucide-react';
import { filesApi } from '../../services/filesApi';
import { useToast } from '../ui/Toast';
import { FileUploadModal } from './FileUploadModal';
import { ConfirmDialog, useConfirm } from '../ui/ConfirmDialog';

interface FileSectionProps {
  entityType: 'customer' | 'job' | 'offer' | 'task' | 'finance_entry';
  entityId: number;
  title?: string;
}

export function FileSection({ entityType, entityId, title = 'Dosyalar' }: FileSectionProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  useEffect(() => {
    fetchFiles();
  }, [entityId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const params = { [`${entityType}_id`]: entityId };
      const data = await filesApi.list(params);
      setFiles(data);
    } catch (err) {
      console.error('Files load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      await filesApi.download(file.id, file.original_filename);
      showToast('Dosya indiriliyor...', 'success');
    } catch (err) {
      showToast('Dosya indirilirken hata oluştu.', 'error');
    }
  };

  const handleDelete = (fileId: number, filename: string) => {
    confirm({
      title: 'Dosyayı Sil',
      description: `"${filename}" dosyası kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await filesApi.delete(fileId);
          showToast('Dosya silindi.', 'success');
          fetchFiles();
        } catch {
          showToast('Dosya silinemedi.', 'error');
        }
      },
    });
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-text-body" />;
  };

  return (
    <Card noPadding>
      <CardHeader 
        title={title} 
        action={
          <Button variant="ghost" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Yükle
          </Button>
        } 
      />
      
      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : files.length === 0 ? (
        <div className="p-10 text-center text-text-body italic text-sm">
          Henüz dosya eklenmemiş.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {files.map(file => (
            <div key={file.id} className="p-4 flex items-center justify-between hover:bg-surface-dim/20 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-surface-dim rounded-lg flex-shrink-0">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-text-high truncate">{file.original_filename}</p>
                  <p className="text-[10px] text-text-body font-medium uppercase">
                    {new Date(file.created_at).toLocaleDateString('tr-TR')} • {(file.file_size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button 
                  onClick={() => handleDownload(file)}
                  className="p-1.5 hover:bg-white rounded-lg text-text-body hover:text-emerald-600 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(file.id, file.original_filename)}
                  className="p-1.5 hover:bg-white rounded-lg text-text-body hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FileUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchFiles}
        initialData={{ [`${entityType}_id`]: entityId }}
      />
      <ConfirmDialog {...confirmProps} />
    </Card>
  );
}
