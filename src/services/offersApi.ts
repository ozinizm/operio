import apiClient from './apiClient';

export const offersApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/offers/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/offers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/offers/', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/offers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/offers/${id}`);
    return response.data;
  },
  convertToJob: async (id: number) => {
    const response = await apiClient.post(`/offers/${id}/convert-to-job`);
    return response.data;
  }
};
