import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { filesApi } from '../../services/filesApi';
import { useToast } from '../ui/Toast';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    customer_id?: number;
    job_id?: number;
    offer_id?: number;
    task_id?: number;
    finance_entry_id?: number;
  };
}

const CATEGORIES = [
  { value: 'general', label: 'Genel' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'offer', label: 'Teklif' },
  { value: 'invoice', label: 'Fatura' },
  { value: 'receipt', label: 'Makbuz/Fiş' },
  { value: 'visual', label: 'Görsel/Tasarım' },
  { value: 'technical_document', label: 'Teknik Doküman' },
  { value: 'delivery_document', label: 'Teslimat Belgesi' },
  { value: 'complaint_document', label: 'Şikayet Belgesi' },
];

export function FileUploadModal({ isOpen, onClose, onSuccess, initialData }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('description', description);
      
      if (initialData?.customer_id) formData.append('customer_id', initialData.customer_id.toString());
      if (initialData?.job_id) formData.append('job_id', initialData.job_id.toString());
      if (initialData?.offer_id) formData.append('offer_id', initialData.offer_id.toString());
      if (initialData?.task_id) formData.append('task_id', initialData.task_id.toString());
      if (initialData?.finance_entry_id) formData.append('finance_entry_id', initialData.finance_entry_id.toString());

      await filesApi.upload(formData);
      showToast('Dosya başarıyla yüklendi.', 'success');
      onSuccess();
      onClose();
      // Reset
      setFile(null);
      setDescription('');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Dosya yüklenirken bir hata oluştu.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dosya Yükle">
      <div className="space-y-4">
        {!file ? (
          <div 
            className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="w-12 h-12 bg-surface-dim rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-text-body" />
            </div>
            <p className="text-sm font-bold text-text-high">Dosya seçmek için tıklayın</p>
            <p className="text-xs text-text-body mt-1">Veya buraya sürükleyip bırakın</p>
            <input 
              id="file-input" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="p-4 bg-surface-dim/30 rounded-2xl flex items-center justify-between border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-text-high truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-text-body uppercase font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-text-body hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          <Select 
            label="Kategori" 
            options={CATEGORIES} 
            value={category} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)} 
          />
          <Input 
            label="Açıklama (Opsiyonel)" 
            placeholder="Dosya hakkında kısa bir not..." 
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="shadow-lg shadow-primary/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Yükle
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
