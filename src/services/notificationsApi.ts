import api from './apiClient';

export interface Notification {
  id: number;
  workspace_id: number;
  user_id: number;
  actor_user_id?: number;
  actor_name?: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const notificationsApi = {
  list: async (limit: number = 50): Promise<Notification[]> => {
    const response = await api.get('/notifications/', { params: { limit } });
    return response.data;
  },
  
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  
  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },
  
  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
  
  generateReminders: async (): Promise<any> => {
    const response = await api.post('/notifications/generate-task-reminders');
    return response.data;
  }
};
