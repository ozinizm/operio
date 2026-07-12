import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export interface PlatformWorkspace {
  id: number;
  name: string;
  slug: string;
  sector?: string;
  status: string;
  plan: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  members_count?: number;
  modules_count?: number;
  created_at: string;
}

export interface PlatformModuleDefinition { key: string; name: string; description?: string; }
export interface PlatformModuleState { module_key: string; is_enabled: boolean; }
export interface PlatformMember {
  id: number; user_id: number; full_name: string; email: string; role: string; is_active: boolean; created_at: string;
}
export interface PlatformActivity {
  id: number; action: string; description: string; entity_type?: string; created_at: string;
  actor_user_id?: number; actor_email?: string; workspace_id?: number;
}
export interface WorkspaceUserInput { full_name: string; email: string; password: string; role: string; is_active: boolean; }
export interface WorkspaceCreateInput {
  name: string; slug: string; sector: string; status: string; owner_name: string; owner_email: string; owner_password: string; active_modules: string[];
}
export interface WorkspaceEnterResult { workspace_id: number; workspace_name: string; workspace_slug: string; }
export interface PlatformSettingItem { key: keyof PlatformSettingsValues; value: string; }
export interface PlatformSettingsValues {
  support_email: string; support_whatsapp: string; support_company_name: string; support_working_hours: string;
  support_emergency_note: string; platform_name: string; platform_footer_text: string;
}
export interface SupportRequest { id: number; email: string; status: string; created_at: string; }
export interface EmailLog {
  id: number; recipient_email: string; subject: string; template_key: string; status: string; created_at: string; error_message?: string;
}
export interface EmailLogResponse { items: EmailLog[]; }
export interface PlatformUserSearchResult { id: number; email: string; full_name: string; workspaces: Array<{ id: number; name?: string }>; }

export const platformApi = {
  getWorkspaces: async () => {
    const response = await axios.get(`${API_URL}/platform/workspaces`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformWorkspace[];
  },

  getAvailableModules: async () => {
    const response = await axios.get(`${API_URL}/platform/available-modules`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformModuleDefinition[];
  },

  createWorkspace: async (data: WorkspaceCreateInput) => {
    const response = await axios.post(`${API_URL}/platform/workspaces`, data, {
      headers: getAuthHeader()
    });
    return response.data as PlatformWorkspace;
  },

  getWorkspace: async (id: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${id}`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformWorkspace;
  },

  updateWorkspace: async (id: number, data: object) => {
    const response = await axios.put(`${API_URL}/platform/workspaces/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data as PlatformWorkspace;
  },

  getAuditLogs: async () => {
    const response = await axios.get(`${API_URL}/platform/audit-logs`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformActivity[];
  },

  getWorkspaceMembers: async (workspaceId: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${workspaceId}/members`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformMember[];
  },

  createWorkspaceUser: async (workspaceId: number, data: WorkspaceUserInput) => {
    const response = await axios.post(`${API_URL}/platform/workspaces/${workspaceId}/users`, data, {
      headers: getAuthHeader()
    });
    return response.data as PlatformMember;
  },

  getWorkspaceModules: async (workspaceId: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${workspaceId}/modules`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformModuleState[];
  },

  toggleModule: async (workspaceId: number, moduleKey: string, enabled: boolean) => {
    const response = await axios.post(`${API_URL}/platform/workspaces/${workspaceId}/modules/toggle`, null, {
      params: { module_key: moduleKey, enabled },
      headers: getAuthHeader()
    });
    return response.data;
  },

  getWorkspaceActivities: async (workspaceId: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${workspaceId}/activities`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformActivity[];
  },

  enterWorkspace: async (id: number) => {
    const response = await axios.post(`${API_URL}/platform/workspaces/${id}/enter`, null, {
      headers: getAuthHeader()
    });
    return response.data as WorkspaceEnterResult;
  },
  resetUserPassword: async (workspaceId: number, userId: number, temporaryPassword: string) => {
    const response = await axios.post(`${API_URL}/platform/workspaces/${workspaceId}/users/${userId}/reset-password`, {
      temporary_password: temporaryPassword
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  exportWorkspace: async (id: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${id}/export`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });
    return response.data;
  },
  hardDeleteWorkspace: async (id: number, confirmSlug: string, backupConfirmed: boolean) => {
    const response = await axios.delete(`${API_URL}/platform/workspaces/${id}/hard-delete`, {
      data: { confirm_slug: confirmSlug, backup_confirmed: backupConfirmed },
      headers: getAuthHeader()
    });
    return response.data;
  },
  getSettings: async () => {
    const response = await axios.get(`${API_URL}/platform/settings`, {
      headers: getAuthHeader()
    });
    return response.data as PlatformSettingItem[];
  },
  updateSettings: async (settings: PlatformSettingsValues) => {
    const response = await axios.put(`${API_URL}/platform/settings`, settings, {
      headers: getAuthHeader()
    });
    return response.data as PlatformSettingsValues;
  },
  getSupportRequests: async () => {
    const response = await axios.get(`${API_URL}/platform/support-requests`, {
      headers: getAuthHeader()
    });
    return response.data as SupportRequest[];
  },
  updateSupportRequest: async (requestId: number, data: object) => {
    const response = await axios.patch(`${API_URL}/platform/support-requests/${requestId}`, data, {
      headers: getAuthHeader()
    });
    return response.data as SupportRequest;
  },
  searchUserByEmail: async (email: string) => {
    const response = await axios.get(`${API_URL}/platform/users/search-by-email`, {
      params: { email },
      headers: getAuthHeader()
    });
    return response.data as PlatformUserSearchResult;
  },
  getEmailLogs: async (params?: object) => {
    const response = await axios.get(`${API_URL}/platform/email-logs`, {
      params,
      headers: getAuthHeader()
    });
    return response.data as EmailLogResponse;
  }
};
