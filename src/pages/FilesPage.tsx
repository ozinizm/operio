import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  File, Search, Upload, 
  MoreVertical, Download, Trash2, 
  FileText, Image as ImageIcon,
  Filter
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { useToast } from '../components/ui/Toast';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';
import { FileUploadModal } from '../components/shared/FileUploadModal';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog, useConfirm } from '../components/ui/ConfirmDialog';

const CATEGORY_LABELS: Record<string, string> = {
  'general': 'Genel',
  'contract': 'Sözleşme',
  'offer': 'Teklif',
  'invoice': 'Fatura',
  'receipt': 'Makbuz/Fiş',
  'visual': 'Görsel/Tasarım',
  'technical_document': 'Teknik Doküman',
  'delivery_document': 'Teslimat Belgesi',
  'complaint_document': 'Şikayet Belgesi',
};

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { showToast } = useToast();
  const { confirmProps, confirm } = useConfirm();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await filesApi.list();
      setFiles(data);
      setError(null);
    } catch (err) {
      setError('Dosyalar yüklenirken bir hata oluştu.');
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
        } catch (err: any) {
          showToast(err.response?.data?.detail || 'Dosya silinirken hata oluştu.', 'error');
        }
      },
    });
  };

  const filteredFiles = files.filter(f => 
    f.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mime.includes('word') || mime.includes('document')) return <FileText className="w-4 h-4 text-indigo-500" />;
    if (mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) return <FileText className="w-4 h-4 text-emerald-500" />;
    return <File className="w-4 h-4 text-text-body" />;
  };

  if (loading) return <LoadingState message="Dosyalar yükleniyor..." />;
  if (error) return <ErrorState description={error} onRetry={fetchFiles} />;

  const totalSize = files.reduce((acc, f) => acc + f.file_size, 0);
  const sizePercentage = Math.min((totalSize / (1024 * 1024 * 1024 * 10)) * 100, 100); // 10GB limit

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-text-high">Dosyalar</h1>
          <p className="text-sm text-text-body mt-1">Tüm kurumsal dokümanlarınızı ve projelerinizi yönetin.</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="shadow-lg shadow-primary/20">
          <Upload className="w-4 h-4 mr-2" /> Dosya Yükle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader title="Depolama" />
            <div className="space-y-4">
              <div className="w-full h-3 bg-surface-dim rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${sizePercentage}%` }} 
                />
              </div>
              <p className="text-xs text-text-body font-medium">
                <span className="font-bold text-text-high">{formatSize(totalSize)}</span> / 10 GB Kullanıldı
              </p>
              
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-blue-500"/> Görseller</span>
                  <span className="font-bold">{formatSize(files.filter(f => f.mime_type.includes('image')).reduce((acc, f) => acc + f.file_size, 0))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-emerald-500"/> Dokümanlar</span>
                  <span className="font-bold">{formatSize(files.filter(f => !f.mime_type.includes('image')).reduce((acc, f) => acc + f.file_size, 0))}</span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-200">
            <p className="text-xs font-bold uppercase opacity-60 tracking-wider mb-2">Hızlı İpucu</p>
            <p className="text-sm leading-relaxed">
              Müşteri detay sayfalarından doğrudan ilgili müşteriye ait dosyaları yükleyebilir ve filtreleyebilirsiniz.
            </p>
          </Card>
        </div>

        {/* File List */}
        <Card className="lg:col-span-3" noPadding>
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xs w-full">
              <Input 
                icon={<Search className="w-4 h-4" />} 
                placeholder="Dosya ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filtrele</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredFiles.length === 0 ? (
              <EmptyState 
                title="Dosya Bulunamadı" 
                description="Aramanıza uygun bir dosya yok veya henüz hiç dosya yüklenmemiş."
                action={{ label: 'Yeni Dosya Yükle', onClick: () => setIsUploadModalOpen(true) }}
              />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-dim/20 text-[10px] uppercase font-bold text-text-body">
                  <tr>
                    <th className="px-6 py-3">Dosya Adı / Kategori</th>
                    <th className="px-6 py-3">Bağlantılı</th>
                    <th className="px-6 py-3">Boyut</th>
                    <th className="px-6 py-3">Tarih</th>
                    <th className="px-6 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFiles.map(file => (
                    <tr key={file.id} className="hover:bg-surface-dim/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-surface-dim rounded-xl group-hover:bg-white transition-colors shadow-sm">
                            {getFileIcon(file.mime_type)}
                          </div>
                          <div>
                            <span className="font-bold text-text-high block group-hover:text-primary transition-colors truncate max-w-[200px]">
                              {file.original_filename}
                            </span>
                            <span className="text-[10px] font-bold text-text-body uppercase opacity-60">
                              {CATEGORY_LABELS[file.category] || file.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {file.customer_id && (
                          <Badge variant="info" className="text-[10px]">Müşteri</Badge>
                        )}
                        {file.job_id && (
                          <Badge variant="default" className="text-[10px] ml-1">İş</Badge>
                        )}
                        {!file.customer_id && !file.job_id && (
                          <span className="text-xs text-text-body italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-body text-xs font-medium">{formatSize(file.file_size)}</td>
                      <td className="px-6 py-4 text-text-body text-xs font-medium">
                        {new Date(file.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleDownload(file)}
                            className="p-2 hover:bg-emerald-50 rounded-lg text-text-body hover:text-emerald-600 transition-colors" 
                            title="İndir"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(file.id, file.original_filename)}
                            className="p-2 hover:bg-red-50 rounded-lg text-text-body hover:text-red-600 transition-colors" 
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-surface-dim rounded-lg text-text-body">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <FileUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchFiles} 
      />
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
