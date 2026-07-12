import apiClient from './apiClient';

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  pending_collection: number;
  overdue_collection: number;
}

export interface FinanceEntry {
  id: number;
  title: string;
  type: 'income' | 'expense' | string;
  amount: number;
  status: string;
  category?: string;
  customer_id?: number;
  job_id?: number;
  customer?: { id?: number; name: string };
  due_date?: string;
  created_at: string;
  description?: string;
}

export const financeApi = {
  getSummary: async () => {
    const response = await apiClient.get('/finance/summary');
    return response.data as FinanceSummary;
  },
  listEntries: async (params?: object) => {
    const response = await apiClient.get('/finance/entries', { params });
    return response.data as FinanceEntry[];
  },
  getEntry: async (id: number) => {
    const response = await apiClient.get(`/finance/entries/${id}`);
    return response.data as FinanceEntry;
  },
  createEntry: async (data: object) => {
    const response = await apiClient.post('/finance/entries', data);
    return response.data;
  },
  updateEntry: async (id: number, data: object) => {
    const response = await apiClient.put(`/finance/entries/${id}`, data);
    return response.data;
  },
  deleteEntry: async (id: number) => {
    const response = await apiClient.delete(`/finance/entries/${id}`);
    return response.data;
  }
};
