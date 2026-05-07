import apiClient from './apiClient';

export const filesApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/files/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/files/${id}`);
    return response.data;
  },
  upload: async (formData: FormData) => {
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/files/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/files/${id}`);
    return response.data;
  },
  download: async (id: number, filename: string) => {
    const response = await apiClient.get(`/files/${id}/download`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
