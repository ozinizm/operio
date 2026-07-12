import api from './apiClient';

export interface RequestTicket {
  id: number;
  workspace_id: number;
  customer_id: number;
  job_id?: number;
  delivery_service_id?: number;
  title: string;
  description?: string;
  type: string; // complaint, request, revision, support, warranty, information
  priority: string; // low, normal, high, critical
  status: string; // new, reviewing, in_progress, waiting_customer, resolved, closed, cancelled
  source: string; // phone, whatsapp, email, website, internal, other
  assigned_user_id?: number;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
  
  // Enriched
  customer_name?: string;
  job_title?: string;
  assigned_user_name?: string;
}

export interface CreateRequestData {
  title: string;
  description?: string;
  type: string;
  priority: string;
  customer_id: number;
  job_id?: number;
  delivery_service_id?: number;
  assigned_user_id?: number;
  source?: string;
}

export const requestsApi = {
  list: async (params?: object) => {
    const response = await api.get<RequestTicket[]>('/requests', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get<RequestTicket>(`/requests/${id}`);
    return response.data;
  },
  create: async (data: CreateRequestData) => {
    const response = await api.post<RequestTicket>('/requests', data);
    return response.data;
  },
  update: async (id: number, data: Partial<CreateRequestData> & { status?: string, resolution_note?: string }) => {
    const response = await api.put<RequestTicket>(`/requests/${id}`, data);
    return response.data;
  },
  resolve: async (id: number, resolution_note: string) => {
    const response = await api.post<RequestTicket>(`/requests/${id}/resolve`, { resolution_note });
    return response.data;
  },
  close: async (id: number) => {
    const response = await api.post<RequestTicket>(`/requests/${id}/close`);
    return response.data;
  },
  reopen: async (id: number) => {
    const response = await api.post<RequestTicket>(`/requests/${id}/reopen`);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/requests/${id}`);
  }
};
