import apiClient from './apiClient';

export type AppointmentSettings = {
  id?: number; workspace_id?: number; is_public_enabled: boolean; public_slug?: string | null;
  business_name?: string | null; headline: string; description?: string | null; logo_url?: string | null;
  cover_url?: string | null; accent_color: string; address?: string | null; phone?: string | null;
  whatsapp?: string | null; timezone: string; slot_interval_minutes: number; min_notice_hours: number;
  max_advance_days: number; require_approval: boolean; success_message: string;
};
export type AppointmentService = { id:number; name:string; description?:string|null; duration_minutes:number; price?:number|null; currency:string; is_active:boolean; sort_order:number; staff_ids:number[] };
export type AppointmentStaff = { id:number; name:string; title?:string|null; email?:string|null; phone?:string|null; photo_url?:string|null; is_active:boolean };
export type Appointment = { id:number; customer_name:string; customer_phone:string; customer_email?:string|null; starts_at:string; ends_at:string; status:string; notes?:string|null; service_id?:number|null; staff_id?:number|null };

export const appointmentsApi = {
  getSettings: async () => (await apiClient.get('/appointments/settings')).data,
  updateSettings: async (data: AppointmentSettings) => (await apiClient.put('/appointments/settings', data)).data,
  listServices: async () => (await apiClient.get('/appointments/services')).data,
  createService: async (data: Omit<AppointmentService,'id'>) => (await apiClient.post('/appointments/services', data)).data,
  updateService: async (id:number, data: Omit<AppointmentService,'id'>) => (await apiClient.put(`/appointments/services/${id}`, data)).data,
  deleteService: async (id:number) => apiClient.delete(`/appointments/services/${id}`),
  listStaff: async () => (await apiClient.get('/appointments/staff')).data,
  createStaff: async (data: Omit<AppointmentStaff,'id'>) => (await apiClient.post('/appointments/staff', data)).data,
  updateStaff: async (id:number, data: Omit<AppointmentStaff,'id'>) => (await apiClient.put(`/appointments/staff/${id}`, data)).data,
  deleteStaff: async (id:number) => apiClient.delete(`/appointments/staff/${id}`),
  listAppointments: async () => (await apiClient.get('/appointments')).data,
  updateStatus: async (id:number, status:string) => (await apiClient.patch(`/appointments/${id}/status`, {status})).data,
  publicConfig: async (slug:string) => (await apiClient.get(`/public/appointments/${slug}`)).data,
  createPublic: async (slug:string, data:Record<string,unknown>) => (await apiClient.post(`/public/appointments/${slug}`, data)).data,
};
