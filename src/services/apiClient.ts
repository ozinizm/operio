import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Standardized error parsing
    const errorMessage = (error.response?.data as any)?.detail || 'Bir hata oluştu.';
    error.message = errorMessage;

    return Promise.reject(error);
  }
);

/**
 * Clean Turkish error messages helper
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail;
    
    if (status === 401) return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
    if (status === 403) return 'Bu işlem için yetkiniz bulunmuyor.';
    if (status === 404) return 'Aranan kayıt bulunamadı.';
    if (status === 500) return 'Sunucu hatası oluştu. Lütfen tekrar deneyin.';
    
    if (detail) return detail;
  }
  
  if (error.request) return 'Bağlantı hatası. Lütfen internetinizi kontrol edin.';
  
  return error.message || 'Bilinmeyen bir hata oluştu.';
};

export default apiClient;
