import apiClient from './apiClient';
import type { Job } from '../types/domain';
export type { Job } from '../types/domain';

export const jobsApi = {
  list: async (params?: { status?: string; priority?: string; customer_id?: number }) => {
    const response = await apiClient.get('/jobs/', { params });
    return response.data as Job[];
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data as Job;
  },
  create: async (data: object) => {
    const response = await apiClient.post('/jobs/', data);
    return response.data;
  },
  update: async (id: number, data: object) => {
    const response = await apiClient.put(`/jobs/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data;
  },
};
