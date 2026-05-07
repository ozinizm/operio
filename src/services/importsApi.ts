import api from './apiClient';

export interface ImportJob {
  id: number;
  workspace_id: number;
  user_id: number;
  import_type: string;
  filename: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  skipped_rows: number;
  imported_rows: number;
  error_report_json?: any;
  preview_json?: any;
  created_at: string;
  updated_at: string;
}

export interface ImportPreviewResponse {
  import_job_id: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  skipped_rows: number;
  preview_rows: any[];
  errors: any[];
}

export const importsApi = {
  previewInventory: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportPreviewResponse>('/imports/inventory/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  confirmInventory: async (importJobId: number) => {
    const formData = new FormData();
    formData.append('import_job_id', importJobId.toString());
    const response = await api.post('/imports/inventory/confirm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  listJobs: async () => {
    const response = await api.get<ImportJob[]>('/imports/jobs');
    return response.data;
  },
  getJob: async (id: number) => {
    const response = await api.get<ImportJob>(`/imports/${id}`);
    return response.data;
  },
  getTemplateUrl: (type: string) => {
    if (type === 'inventory') return `${api.defaults.baseURL}/inventory/template`;
    return `${api.defaults.baseURL}/imports/templates/${type}`;
  }
};
