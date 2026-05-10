import api from './apiClient';

export interface TeamMember {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const teamApi = {
  list: async () => {
    const response = await api.get<TeamMember[]>('/users/team');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/users/team', data);
    return response.data;
  },
  update: async (userId: number, data: any) => {
    const response = await api.patch(`/users/team/${userId}`, data);
    return response.data;
  },
  resetPassword: async (userId: number, password: string) => {
    const response = await api.post(`/users/team/${userId}/reset-password`, { password });
    return response.data;
  }
};
