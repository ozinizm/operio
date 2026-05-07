import api from './apiClient';

export interface Comment {
  id: number;
  workspace_id: number;
  author_user_id: number;
  author_name?: string;
  entity_type: string;
  entity_id: number;
  body: string;
  parent_comment_id?: number;
  created_at: string;
  updated_at?: string;
}

export const commentsApi = {
  list: async (entityType: string, entityId: number): Promise<Comment[]> => {
    const response = await api.get('/comments', { params: { entity_type: entityType, entity_id: entityId } });
    return response.data;
  },
  
  create: async (data: { entity_type: string; entity_id: number; body: string; parent_comment_id?: number }): Promise<Comment> => {
    const response = await api.post('/comments', data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  }
};
