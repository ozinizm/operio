import apiClient from './apiClient';

export const authApi = {
  login: async (formData: FormData) => {
    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  changePassword: async (data: any) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
};
