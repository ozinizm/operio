import apiClient from './apiClient';

export interface Job {
  id: number;
  title: string;
  status: string;
  priority: string;
  customer_id: number;
  customer?: {
    id: number;
    name: string;
  };
  progress: number;
  created_at: string;
}

export const jobsApi = {
  list: async (params?: { status?: string; priority?: string; customer_id?: number }) => {
    const response = await apiClient.get('/jobs/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/jobs/', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/jobs/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data;
  },
};
