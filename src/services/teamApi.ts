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
  create: async (data: object) => {
    const response = await api.post('/users/team', data);
    return response.data;
  },
  update: async (memberId: number, data: object) => {
    const response = await api.patch(`/users/team/${memberId}`, data);
    return response.data;
  },
  resetPassword: async (memberId: number, password: string) => {
    const response = await api.post(`/users/team/${memberId}/reset-password`, { new_password: password });
    return response.data;
  }
};
