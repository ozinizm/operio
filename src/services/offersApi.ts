import apiClient from './apiClient';
import type { Offer } from '../types/domain';

export const offersApi = {
  list: async (params?: object) => {
    const response = await apiClient.get('/offers/', { params });
    return response.data as Offer[];
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/offers/${id}`);
    return response.data as Offer;
  },
  create: async (data: object) => {
    const response = await apiClient.post('/offers/', data);
    return response.data as Offer;
  },
  update: async (id: number, data: object) => {
    const response = await apiClient.put(`/offers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/offers/${id}`);
    return response.data;
  },
  convertToJob: async (id: number) => {
    const response = await apiClient.post(`/offers/${id}/convert-to-job`);
    return response.data as { job_id: number };
  }
};
