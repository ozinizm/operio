import apiClient from './apiClient';
import type { Customer } from '../types/domain';
export type { Customer } from '../types/domain';

export const customersApi = {
  list: async (params?: { q?: string; status?: string }) => {
    const response = await apiClient.get('/customers/', { params });
    return response.data as Customer[];
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data as Customer;
  },
  create: async (data: object) => {
    const response = await apiClient.post('/customers/', data);
    return response.data;
  },
  update: async (id: number, data: object) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
};
