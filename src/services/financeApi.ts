import apiClient from './apiClient';

export const financeApi = {
  getSummary: async () => {
    const response = await apiClient.get('/finance/summary');
    return response.data;
  },
  listEntries: async (params?: any) => {
    const response = await apiClient.get('/finance/entries', { params });
    return response.data;
  },
  getEntry: async (id: number) => {
    const response = await apiClient.get(`/finance/entries/${id}`);
    return response.data;
  },
  createEntry: async (data: any) => {
    const response = await apiClient.post('/finance/entries', data);
    return response.data;
  },
  updateEntry: async (id: number, data: any) => {
    const response = await apiClient.put(`/finance/entries/${id}`, data);
    return response.data;
  },
  deleteEntry: async (id: number) => {
    const response = await apiClient.delete(`/finance/entries/${id}`);
    return response.data;
  }
};
