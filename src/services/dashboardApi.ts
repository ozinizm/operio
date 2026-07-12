import apiClient from './apiClient';

export interface DashboardActivity {
  id?: number | string;
  entity_type: string;
  entity_id?: number;
  action?: string;
  description?: string;
  created_at: string;
  user_name?: string;
}

export interface DashboardTask {
  id: number;
  title: string;
  priority: string;
  due_date: string;
  assignee_user_id?: number;
}

export interface DashboardSummary {
  active_customers: number;
  open_jobs: number;
  today_tasks: number;
  pending_deliveries: number;
  open_complaints: number;
  critical_requests: number;
  pending_collection: number;
  low_stock_count: number;
  offer_summary?: { sent_offers: number; approved_offers: number };
  operation_summary?: Record<string, number>;
  recent_activities: DashboardActivity[];
  upcoming_tasks: DashboardTask[];
}

export const dashboardApi = {
  getSummary: async () => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data as DashboardSummary;
  },
};
