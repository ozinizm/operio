import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface ApiErrorBody {
  detail?: string;
}

export type ApiErrorKind = 'unauthorized' | 'forbidden' | 'not_found' | 'validation' | 'server' | 'timeout' | 'offline' | 'network' | 'cancelled' | 'unknown';

export interface ClassifiedApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  retryable: boolean;
}

function asAxiosError(error: unknown): AxiosError<ApiErrorBody> | null {
  return axios.isAxiosError<ApiErrorBody>(error) ? error : null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandled = false;

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Platform Manager Mode Header
    const isPlatformManager = localStorage.getItem('operio_platform_manager_mode') === 'true';
    const activeWorkspaceId = localStorage.getItem('operio_active_workspace_id');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (isPlatformManager && activeWorkspaceId && user?.is_super_admin && config.headers) {
      // Don't add header to auth or platform endpoints to avoid context confusion
      // but backend deps are designed to handle it safely
      config.headers['X-Active-Workspace-Id'] = activeWorkspaceId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config.url?.includes('/auth/')) unauthorizedHandled = false;
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      if (!unauthorizedHandled && window.location.pathname !== '/login') {
        unauthorizedHandled = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');
        localStorage.removeItem('role');
        window.dispatchEvent(new CustomEvent('tavelya:auth-expired'));
        window.location.replace('/login');
      }
    }

    // Standardized error parsing
    const errorMessage = (error.response?.data as ApiErrorBody | undefined)?.detail || 'Bir hata oluştu.';
    error.message = errorMessage;

    return Promise.reject(error);
  }
);

export const classifyApiError = (error: unknown): ClassifiedApiError => {
  const axiosError = asAxiosError(error);
  if (!axiosError) {
    return { kind: 'unknown', message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.', retryable: false };
  }
  if (axios.isCancel(axiosError) || axiosError.code === 'ERR_CANCELED') {
    return { kind: 'cancelled', message: 'İstek iptal edildi.', retryable: false };
  }
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
    return { kind: 'timeout', message: 'Sunucu zamanında yanıt vermedi. Tekrar deneyin.', retryable: true };
  }
  const status = axiosError.response?.status;
  const detail = axiosError.response?.data?.detail;
  if (status) {
    if (status === 401) return { kind: 'unauthorized', status, message: window.location.pathname === '/login' ? 'E-posta veya şifre hatalı.' : 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.', retryable: false };
    if (status === 403) return { kind: 'forbidden', status, message: detail || 'Bu işlem için yetkiniz bulunmuyor.', retryable: false };
    if (status === 404) return { kind: 'not_found', status, message: detail || 'Aranan kayıt bulunamadı.', retryable: false };
    if (status === 422) return { kind: 'validation', status, message: detail || 'Gönderilen bilgileri kontrol edin.', retryable: false };
    if (status >= 500) return { kind: 'server', status, message: detail || 'Sunucu hatası oluştu. Lütfen tekrar deneyin.', retryable: true };
    return { kind: 'unknown', status, message: detail || 'İşlem tamamlanamadı.', retryable: false };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { kind: 'offline', message: 'İnternet bağlantısı bulunamadı.', retryable: true };
  }
  if (axiosError.request) {
    return { kind: 'network', message: 'Sunucuya ulaşılamadı. Bağlantınızı veya servisin durumunu kontrol edin.', retryable: true };
  }
  return { kind: 'unknown', message: axiosError.message || 'Bilinmeyen bir hata oluştu.', retryable: false };
};

/**
 * Clean Turkish error messages helper
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  return classifyApiError(error).message;
};

export default apiClient;
