import apiClient from './apiClient';

export const tasksApi = {
  list: async (params?: { status?: string; assignee_user_id?: number; job_id?: number }) => {
    const response = await apiClient.get('/tasks/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/tasks/', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};
