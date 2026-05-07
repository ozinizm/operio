import api from './apiClient';

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  route: string;
  sidebar_label: string;
  sidebar_order: number;
  icon: string;
  is_core: boolean;
  can_disable: boolean;
  is_available: boolean;
  is_premium: boolean;
  status: string;
  plan_tier: string;
  is_enabled: boolean;
}

export interface SidebarModule {
  key: string;
  label: string;
  route: string;
  icon: string;
  order: number;
}

export const modulesApi = {
  list: async () => {
    const response = await api.get<ModuleDefinition[]>('/modules');
    return response.data;
  },
  getEnabled: async () => {
    const response = await api.get<string[]>('/modules/enabled');
    return response.data;
  },
  getSidebar: async () => {
    const response = await api.get<SidebarModule[]>('/modules/sidebar');
    return response.data;
  },
  enable: async (key: string) => {
    const response = await api.post(`/modules/${key}/enable`);
    return response.data;
  },
  disable: async (key: string) => {
    const response = await api.post(`/modules/${key}/disable`);
    return response.data;
  },
  enablePack: async (packKey: string) => {
    const response = await api.post(`/modules/packs/${packKey}/enable`);
    return response.data;
  }
};
