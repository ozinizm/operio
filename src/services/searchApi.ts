import apiClient from './apiClient';

export interface SearchResult {
  id: number;
  label: string;
  subtitle?: string;
  path: string;
}

export interface GlobalSearchResponse {
  customers: SearchResult[];
  jobs: SearchResult[];
  people: SearchResult[];
}

export const searchApi = {
  search: async (query: string): Promise<GlobalSearchResponse> => {
    const response = await apiClient.get('/search', { params: { q: query } });
    return response.data;
  },
};
