import api from './apiClient';

export interface DeliveryService {
  id: number;
  workspace_id: number;
  customer_id: number;
  job_id?: number;
  title: string;
  type: string; // delivery, service, installation, pickup, inspection, maintenance
  status: string; // planned, on_the_way, in_progress, completed, postponed, cancelled
  scheduled_at: string;
  completed_at?: string;
  assigned_user_id?: number;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  result_note?: string;
  created_at: string;
  updated_at: string;
  
  // Enriched
  customer_name?: string;
  job_title?: string;
  assigned_user_name?: string;
}

export interface CreateDeliveryData {
  title: string;
  type: string;
  customer_id: number;
  job_id?: number;
  scheduled_at: string;
  assigned_user_id?: number;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
}

export const deliveryServiceApi = {
  list: async (params?: object) => {
    const response = await api.get<DeliveryService[]>('/delivery-services', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get<DeliveryService>(`/delivery-services/${id}`);
    return response.data;
  },
  create: async (data: CreateDeliveryData) => {
    const response = await api.post<DeliveryService>('/delivery-services', data);
    return response.data;
  },
  update: async (id: number, data: Partial<CreateDeliveryData> & { status?: string, result_note?: string }) => {
    const response = await api.put<DeliveryService>(`/delivery-services/${id}`, data);
    return response.data;
  },
  complete: async (id: number, result_note?: string) => {
    const response = await api.post<DeliveryService>(`/delivery-services/${id}/complete`, { result_note });
    return response.data;
  },
  postpone: async (id: number, new_date: string, reason?: string) => {
    const response = await api.post<DeliveryService>(`/delivery-services/${id}/postpone`, { new_date, reason });
    return response.data;
  },
  cancel: async (id: number, reason?: string) => {
    const response = await api.post<DeliveryService>(`/delivery-services/${id}/cancel`, { reason });
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/delivery-services/${id}`);
  }
};
