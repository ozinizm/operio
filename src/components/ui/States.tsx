import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function LoadingState({ message = 'Yükleniyor...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-text-body font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ 
  title = 'Veri bulunamadı', 
  description = 'Burada gösterilecek bir kayıt bulunmuyor.', 
  icon: Icon = Inbox,
  action
}: { 
  title?: string; 
  description?: string; 
  icon?: any;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-surface-dim rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-text-body opacity-40" />
      </div>
      <h3 className="text-lg font-jakarta font-bold text-text-high mb-2">{title}</h3>
      <p className="text-sm text-text-body max-w-xs mb-6 leading-relaxed">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

export function ErrorState({ 
  title = 'Bir hata oluştu', 
  description = 'İşlem gerçekleştirilirken beklenmedik bir sorun yaşandı.', 
  onRetry 
}: { 
  title?: string; 
  description?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-jakarta font-bold text-text-high mb-2">{title}</h3>
      <p className="text-sm text-text-body max-w-xs mb-6">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>Tekrar Dene</Button>
      )}
    </div>
  );
}
