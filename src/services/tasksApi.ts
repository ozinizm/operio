import apiClient from './apiClient';
import type { Task, TeamMember } from '../types/domain';

export const tasksApi = {
  list: async (params?: { status?: string; assignee_user_id?: number; job_id?: number }) => {
    const response = await apiClient.get('/tasks/', { params });
    return response.data as Task[];
  },
  listTeam: async () => {
    const response = await apiClient.get('/users/team');
    return response.data as TeamMember[];
  },
  get: async (id: number) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data as Task;
  },
  create: async (data: object) => {
    const response = await apiClient.post('/tasks/', data);
    return response.data;
  },
  update: async (id: number, data: object) => {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};
