import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const formatDate = (date: string | Date, pattern = 'd MMMM yyyy'): string => {
  if (!date) return '—';
  return format(new Date(date), pattern, { locale: tr });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '—';
  return format(new Date(date), 'd MMM yyyy HH:mm', { locale: tr });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY',
    maximumFractionDigits: 0 
  }).format(amount);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (date: string | Date): string => {
  if (!date) return '—';
  return format(new Date(date), 'HH:mm', { locale: tr });
};
