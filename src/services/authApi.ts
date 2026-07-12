import apiClient from './apiClient';
import type { AuthSession, LoginResponse } from '../types/domain';

export interface PublicPlatformSettings {
  support_email: string;
  support_whatsapp: string;
  support_company_name: string;
  support_working_hours: string;
  support_emergency_note: string;
  platform_name: string;
}

export const authApi = {
  login: async (formData: FormData) => {
    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data as LoginResponse;
  },
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data as AuthSession;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  changePassword: async (data: object) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  getPublicSettings: async () => {
    const response = await apiClient.get('/public/platform-settings');
    return response.data as PublicPlatformSettings;
  }
};
