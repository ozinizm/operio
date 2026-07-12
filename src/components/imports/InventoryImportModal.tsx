import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/ToastContext';
import { importsApi, type ImportFieldError, type ImportPreviewResponse, type ImportRowError, type InventoryPreviewRow } from '../../services/importsApi';
import { getErrorMessage } from '../../services/apiClient';
import { 
  FileSpreadsheet, Upload, AlertCircle, 
  CheckCircle2, ChevronRight, 
  FileText, Download
} from 'lucide-react';

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InventoryImportModal({ isOpen, onClose, onSuccess }: InventoryImportModalProps) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Success
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const extension = selected.name.toLowerCase();
      if (!extension.endsWith('.csv') && !extension.endsWith('.xlsx')) {
        showToast('Yalnız .csv veya .xlsx dosyası seçebilirsiniz.', 'error');
        e.target.value = '';
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        showToast('Dosya boyutu 10 MB sınırını aşıyor.', 'error');
        e.target.value = '';
        return;
      }
      setFile(selected);
    }
  };

  const downloadErrorReport = () => {
    if (!preview?.errors?.length) return;
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = ['Satır,Alan,Hata'];
    preview.errors.forEach(row => row.errors.forEach(fieldError => {
      lines.push([row.row_number, fieldError.field, fieldError.message].map(escapeCsv).join(','));
    }));
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tavelya-aktarim-hata-raporu.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await importsApi.previewInventory(file);
      if (data && data.import_job_id) {
        setPreview(data);
        setStep(2);
      } else {
        throw new Error('Geçersiz sunucu yanıtı.');
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err) || 'Dosya yüklenirken hata oluştu.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    const jobId = preview?.import_job_id;
    if (!jobId) {
      showToast('Aktarım kaydı bulunamadı. Lütfen dosyayı tekrar yükleyin.', 'error');
      setStep(1);
      return;
    }
    
    setIsConfirming(true);
    try {
      const response = await importsApi.confirmInventory(jobId);
      
      // If we got a success response, move to success step
      if (response && (response.success || response.imported_rows !== undefined)) {
        showToast('Stok listesi başarıyla aktarıldı.', 'success');
        setStep(3);
        // Refresh parent history after a safe delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 400);
      } else {
        throw new Error('Aktarım tamamlanamadı.');
      }
    } catch (err: unknown) {
      console.error('Import confirm error:', err);
      showToast(getErrorMessage(err) || 'Aktarım tamamlanamadı.', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-text-high/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleClose} />
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-modal relative z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-jakarta font-extrabold text-text-high flex items-center gap-3 tracking-tight">
              <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              Stok Listesi Aktarımı
            </h2>
            <p className="text-xs text-text-body font-medium mt-1">Excel dosyanızı sisteme güvenli şekilde aktarın.</p>
          </div>
          <button onClick={handleClose} className="p-3 hover:bg-surface-dim rounded-2xl transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-10 gap-6">
            {[
              { s: 1, label: 'Yükle' },
              { s: 2, label: 'Önizle' },
              { s: 3, label: 'Tamamla' }
            ].map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${step === item.s ? 'bg-primary text-white ring-4 ring-primary/20' : step > item.s ? 'bg-emerald-500 text-white' : 'bg-surface-dim border-2 border-border text-text-body/40'}`}>
                    {step > item.s ? <CheckCircle2 className="w-5 h-5" /> : item.s}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step >= item.s ? 'text-primary' : 'text-text-body/40'}`}>{item.label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-16 h-1 mx-4 rounded-full transition-colors duration-500 ${step > item.s ? 'bg-emerald-500' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-4 border-dashed border-border/40 rounded-[2rem] p-16 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-2xl shadow-black/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 text-primary">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-jakarta font-bold text-text-high mb-2">Excel veya CSV dosyanızı buraya bırakın</h3>
                  <p className="text-sm text-text-body font-medium opacity-60">veya dosyayı seçmek için tıklayın</p>
                  
                  {file ? (
                    <div className="mt-8 animate-in zoom-in duration-300">
                      <Badge variant="info" className="py-3 px-6 text-sm bg-primary/10 text-primary border-none rounded-xl">
                        <FileText className="w-5 h-5 mr-3" /> {file.name}
                      </Badge>
                    </div>
                  ) : (
                    <div className="mt-8 flex gap-3 text-[10px] font-bold text-text-body/40 uppercase tracking-widest">
                      <span>.XLSX</span>
                      <span>•</span>
                      <span>.CSV</span>
                      <span>•</span>
                      <span>MAKS. 10MB</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-amber-50/50 p-6 rounded-3xl flex gap-4 items-start border border-amber-100">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">Önemli Hatırlatma</p>
                  <p className="text-xs text-amber-800/70 leading-relaxed font-medium">
                    Doğru aktarım için lütfen Tavelya standart şablonunu kullanın.
                    Ürün Adı, Birim ve Miktar alanları doldurulması zorunludur.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={handleClose}>İptal Et</Button>
                <Button className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20" onClick={handleUpload} disabled={!file} isLoading={isUploading}>
                  Yükle ve Önizle <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && preview && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-3xl text-center shadow-sm">
                  <p className="text-3xl font-black text-emerald-600 tracking-tighter">{preview.valid_rows ?? 0}</p>
                  <p className="text-[9px] uppercase font-black text-emerald-800/60 tracking-widest mt-1">Geçerli</p>
                </div>
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-3xl text-center shadow-sm">
                  <p className="text-3xl font-black text-red-600 tracking-tighter">{preview.invalid_rows ?? 0}</p>
                  <p className="text-[9px] uppercase font-black text-red-800/60 tracking-widest mt-1">Hatalı</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-3xl text-center shadow-sm">
                  <p className="text-3xl font-black text-amber-600 tracking-tighter">{preview.skipped_rows ?? 0}</p>
                  <p className="text-[9px] uppercase font-black text-amber-800/60 tracking-widest mt-1">Atlanan</p>
                </div>
                <div className="bg-surface-dim/50 border border-border/60 p-4 rounded-3xl text-center shadow-sm">
                  <p className="text-3xl font-black text-text-high tracking-tighter">{preview.total_rows ?? 0}</p>
                  <p className="text-[9px] uppercase font-black text-text-body/60 tracking-widest mt-1">Toplam</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Error List */}
                <div className="bg-white rounded-3xl border border-border overflow-hidden flex flex-col h-[350px] shadow-soft">
                  <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between sticky top-0 z-10">
                    <span className="text-[11px] font-black text-red-800 uppercase tracking-[0.15em]">Hata Raporu</span>
                    <div className="flex items-center gap-2"><Badge variant="error" className="text-[10px] font-black px-3">{preview.errors?.length || 0} UYARI</Badge>{preview.errors?.length > 0 && <button type="button" onClick={downloadErrorReport} className="rounded-lg p-2 text-red-700 hover:bg-red-100" title="Hata raporunu indir" aria-label="Hata raporunu indir"><Download className="h-4 w-4" /></button>}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {Array.isArray(preview.errors) && preview.errors.length > 0 ? (
                      preview.errors.map((err: ImportRowError, i: number) => (
                        <div key={i} className="bg-red-50/30 p-4 rounded-2xl border border-red-100/30 flex items-start gap-4 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {err.row_number}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-red-900">Satır {err.row_number}</p>
                            <div className="space-y-1">
                              {Array.isArray(err.errors) ? err.errors.map((e: ImportFieldError, ei: number) => (
                                <p key={ei} className="text-[11px] font-medium text-red-700/80 leading-relaxed">
                                  <span className="font-bold">[{e.field}]:</span> {e.message}
                                </p>
                              )) : (
                                <p className="text-[11px] font-medium text-red-700/80 leading-relaxed">Bilinmeyen hata</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        <p className="text-xs font-bold uppercase tracking-widest">Hata Bulunmadı</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Preview */}
                <div className="bg-white rounded-3xl border border-border overflow-hidden flex flex-col h-[350px] shadow-soft">
                  <div className="px-6 py-4 bg-surface-dim/30 border-b border-border flex items-center justify-between sticky top-0 z-10">
                    <span className="text-[11px] font-black text-text-body uppercase tracking-[0.15em]">Önizleme</span>
                    <span className="text-[10px] font-bold text-text-body/50 uppercase tracking-widest">İlk 10 Kayıt</span>
                  </div>
                  <div className="flex-1 overflow-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-dim/10 sticky top-0">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-text-body uppercase tracking-widest">Ürün / SKU</th>
                          <th className="px-6 py-4 text-[10px] font-black text-text-body uppercase tracking-widest text-center">Stok / Birim</th>
                          <th className="px-6 py-4 text-[10px] font-black text-text-body uppercase tracking-widest text-right">Alış / Satış</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {Array.isArray(preview.preview_rows) && preview.preview_rows.length > 0 ? (
                          preview.preview_rows.map((row: InventoryPreviewRow, i: number) => (
                            <tr key={i} className="hover:bg-surface-dim/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-xs font-extrabold text-text-high truncate max-w-[150px]">{row.name || 'Bilinmeyen'}</div>
                                <div className="text-[10px] font-medium text-text-body opacity-40 uppercase tracking-tighter">{row.sku || '-'}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-xs font-black text-text-high">{row.quantity ?? 0}</div>
                                <div className="text-[10px] font-bold text-text-body/50 uppercase">{row.unit || '-'}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="text-[11px] font-black text-text-high">{row.purchase_price ?? 0}</div>
                                <div className="text-[11px] font-black text-primary">{row.sale_price ?? 0}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-text-body/40 text-xs italic">Gösterilecek kayıt yok.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setStep(1)}>Geri Dön</Button>
                <Button 
                  type="button"
                  className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20" 
                  onClick={handleConfirm} 
                  disabled={!preview?.valid_rows || preview.valid_rows === 0} 
                  isLoading={isConfirming}
                >
                  {preview?.valid_rows || 0} Geçerli Satırı Aktar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="py-16 text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                <div className="relative w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xl shadow-emerald-200">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <h3 className="text-3xl font-jakarta font-black text-text-high tracking-tight">Harika! Veriler Aktarıldı</h3>
                <p className="text-sm text-text-body font-medium leading-relaxed opacity-70">
                  Seçtiğiniz {preview?.valid_rows || 0} adet stok verisi başarıyla sisteme kaydedildi. 
                  Artık tüm ekip güncel stok bilgilerini görebilir.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button className="px-12 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20" onClick={handleClose}>Kapat ve Bitir</Button>
                <Button variant="outline" className="px-12 h-14 rounded-2xl font-bold border-dashed" onClick={reset}>Yeni Dosya Yükle</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
