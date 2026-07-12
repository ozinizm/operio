import apiClient from './apiClient';

export interface StoredFile {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  category: string;
  description?: string;
  created_at: string;
  customer_id?: number;
  job_id?: number;
  offer_id?: number;
  task_id?: number;
  finance_entry_id?: number;
}

export const filesApi = {
  list: async (params?: object) => {
    const response = await apiClient.get('/files/', { params });
    return response.data as StoredFile[];
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/files/${id}`);
    return response.data as StoredFile;
  },
  upload: async (formData: FormData) => {
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data as StoredFile;
  },
  update: async (id: number, data: object) => {
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
