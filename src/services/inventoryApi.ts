import api from './apiClient';

export interface InventoryItem {
  id: number;
  workspace_id: number;
  sku?: string;
  name: string;
  category?: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  purchase_price?: number;
  sale_price?: number;
  supplier?: string;
  warehouse_location?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventorySummary {
  total_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_stock_value: number;
  categories_count: number;
}

export const inventoryApi = {
  list: async (params?: object) => {
    const response = await api.get<InventoryItem[]>('/inventory', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response.data;
  },
  create: async (data: object) => {
    const response = await api.post<InventoryItem>('/inventory', data);
    return response.data;
  },
  update: async (id: number, data: object) => {
    const response = await api.put<InventoryItem>(`/inventory/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/inventory/${id}`);
  },
  getSummary: async () => {
    const response = await api.get<InventorySummary>('/inventory/summary');
    return response.data;
  },
  getTemplateUrl: () => {
    return `${api.defaults.baseURL}/inventory/template`;
  },
  getExportUrl: () => {
    return `${api.defaults.baseURL}/inventory/export`;
  }
};
