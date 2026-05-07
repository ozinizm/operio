import apiClient from './apiClient';

export const reportsApi = {
  getOverview: async () => {
    const response = await apiClient.get('/reports/overview');
    return response.data;
  },
  getCustomers: async () => {
    const response = await apiClient.get('/reports/customers');
    return response.data;
  },
  getJobs: async () => {
    const response = await apiClient.get('/reports/jobs');
    return response.data;
  },
  getFinance: async () => {
    const response = await apiClient.get('/reports/finance');
    return response.data;
  },
  getOperations: async () => {
    const response = await apiClient.get('/reports/operations');
    return response.data;
  },
  exportSummary: async () => {
    const response = await apiClient.get('/reports/export/summary', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `operio_rapor_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
