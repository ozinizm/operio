import { Button } from '../ui/Button';
import { Download, Upload, FileText, Check, ChevronRight } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { useState } from 'react';

export function ExcelImportActions() {
  const { showToast } = useToast();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);

  const handleExport = () => {
    showToast('Excel çıktısı hazırlanıyor...', 'info');
    setTimeout(() => showToast('Excel dosyası başarıyla indirildi.', 'success'), 1500);
  };

  const handleDownloadTemplate = () => {
    showToast('Örnek şablon indiriliyor...', 'info');
    setTimeout(() => showToast('Örnek şablon başarıyla indirildi.', 'success'), 1000);
  };

  const nextStep = () => setImportStep(prev => prev + 1);
  const finishImport = () => {
    setIsImportModalOpen(false);
    setImportStep(1);
    showToast('Veriler başarıyla aktarıldı.', 'success');
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
        <FileText className="w-4 h-4 mr-2" /> Şablon
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" /> Dışa Aktar
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setIsImportModalOpen(true)}>
        <Upload className="w-4 h-4 mr-2" /> İçe Aktar
      </Button>

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        title="Excel'den Veri Aktar"
        size="lg"
      >
        <div className="space-y-8">
          {/* Stepper */}
          <div className="flex items-center justify-between">
            {['Dosya Yükle', 'Alan Eşleştirme', 'Önizleme', 'Onay'].map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep > idx + 1 ? 'bg-emerald-500 text-white' : importStep === idx + 1 ? 'bg-primary text-white' : 'bg-surface-dim text-text-body'}`}>
                  {importStep > idx + 1 ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span className={`text-xs font-bold ${importStep === idx + 1 ? 'text-text-high' : 'text-text-body opacity-50'}`}>{step}</span>
                {idx < 3 && <ChevronRight className="w-3 h-3 text-border" />}
              </div>
            ))}
          </div>

          <div className="py-8 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center bg-background/50">
            {importStep === 1 && (
              <>
                <div className="p-4 bg-primary/5 text-primary rounded-full mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="font-bold text-text-high">Dosyanızı Buraya Sürükleyin</p>
                <p className="text-xs text-text-body mt-1">Veya bilgisayarınızdan seçin (Max 10MB)</p>
                <Button className="mt-6" onClick={nextStep}>Dosya Seç</Button>
              </>
            )}
            {importStep === 2 && (
              <div className="w-full max-w-md px-6 text-left space-y-4">
                <p className="text-sm font-bold text-text-high">Alanları Eşleştirin</p>
                {['Müşteri Adı', 'E-posta', 'Telefon', 'Sektör'].map(field => (
                  <div key={field} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-medium">{field}</span>
                    <select className="text-xs border-none bg-transparent focus:ring-0 font-bold text-primary">
                      <option>{field}</option>
                      <option>Diğer Sütun</option>
                    </select>
                  </div>
                ))}
                <Button className="w-full mt-6" onClick={nextStep}>Devam Et</Button>
              </div>
            )}
            {importStep === 3 && (
              <div className="w-full px-6">
                <p className="text-sm font-bold text-text-high mb-4">Veri Önizleme (Örnek 5 Satır)</p>
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-surface-dim/30">
                      <tr>
                        <th className="p-2">Ad</th>
                        <th className="p-2">E-posta</th>
                        <th className="p-2">Telefon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[1, 2, 3].map(i => (
                        <tr key={i}>
                          <td className="p-2">Müşteri {i}</td>
                          <td className="p-2">info@test{i}.com</td>
                          <td className="p-2">0555...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button className="w-full mt-6" onClick={nextStep}>Onayla ve İçe Aktar</Button>
              </div>
            )}
            {importStep === 4 && (
              <>
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <p className="font-bold text-text-high">Aktarım Hazır!</p>
                <p className="text-xs text-text-body mt-1">324 kayıt başarıyla işlendi ve aktarılmaya hazır.</p>
                <Button className="mt-6" onClick={finishImport}>İşlemi Tamamla</Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
