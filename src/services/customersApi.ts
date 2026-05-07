import apiClient from './apiClient';

export interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status: string;
  sector?: string;
  address?: string;
  created_at: string;
}

export const customersApi = {
  list: async (params?: { q?: string; status?: string }) => {
    const response = await apiClient.get('/customers/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/customers/', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
};
