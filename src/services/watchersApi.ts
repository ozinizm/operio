import api from './apiClient';

export interface Watcher {
  id: number;
  workspace_id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  created_at: string;
}

export const watchersApi = {
  watch: async (entityType: string, entityId: number): Promise<Watcher> => {
    const response = await api.post('/watchers/watch', { entity_type: entityType, entity_id: entityId });
    return response.data;
  },
  
  unwatch: async (entityType: string, entityId: number): Promise<void> => {
    await api.post('/watchers/unwatch', { entity_type: entityType, entity_id: entityId });
  },
  
  list: async (): Promise<Watcher[]> => {
    const response = await api.get('/watchers');
    return response.data;
  }
};
