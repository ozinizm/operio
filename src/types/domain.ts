export interface ResourceCreatedDetail {
  type: string;
  id?: number;
}

export type ResourceCreatedEvent = CustomEvent<ResourceCreatedDetail>;

export interface CustomerSummary {
  id: number;
  name: string;
}

export interface Customer extends CustomerSummary {
  contact_person?: string;
  email?: string;
  phone?: string;
  status: string;
  sector?: string;
  address?: string;
  created_at: string;
  responsible_user_id?: number;
}

export interface TeamMember {
  user_id: number;
  full_name: string;
  email: string;
  role?: string;
}

export interface Offer {
  id: number;
  title: string;
  offer_no?: string;
  amount: number;
  status: string;
  description?: string;
  valid_until?: string;
  customer_id?: number;
  customer?: CustomerSummary;
  converted_job_id?: number;
}

export interface OfferEditForm {
  title: string;
  amount: string | number;
  status: string;
  description: string;
  valid_until: string;
  customer_id: number | string;
}

export interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  description?: string;
  due_date?: string;
  assignee_user_id?: number | null;
  assignee?: { full_name: string };
}

export interface TaskEditForm {
  title: string;
  priority: string;
  status: string;
  due_date: string;
  description: string;
  assignee_user_id: number | '' | null;
}

export interface Job {
  id: number;
  title: string;
  status: string;
  priority: string;
  customer_id: number;
  customer?: CustomerSummary;
  progress: number;
  created_at: string;
  due_date?: string;
  job_type?: string;
  responsible_user_id?: number;
  responsible_user?: { full_name: string };
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_super_admin?: boolean;
  must_change_password?: boolean;
}

export interface WorkspaceSummary {
  id: number;
  name: string;
  slug?: string;
  sector?: string;
}

export interface AuthSession {
  user: AuthUser;
  workspace: WorkspaceSummary | null;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}
