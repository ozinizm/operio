import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const platformApi = {
  getWorkspaces: async () => {
    const response = await axios.get(`${API_URL}/platform/workspaces`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getAvailableModules: async () => {
    const response = await axios.get(`${API_URL}/platform/available-modules`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  createWorkspace: async (data: any) => {
    const response = await axios.post(`${API_URL}/platform/workspaces`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getWorkspace: async (id: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateWorkspace: async (id: number, data: any) => {
    const response = await axios.put(`${API_URL}/platform/workspaces/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await axios.get(`${API_URL}/platform/audit-logs`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getWorkspaceMembers: async (workspaceId: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${workspaceId}/members`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  createWorkspaceUser: async (workspaceId: number, data: any) => {
    const response = await axios.post(`${API_URL}/platform/workspaces/${workspaceId}/users`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getWorkspaceModules: async (workspaceId: number) => {
    const response = await axios.get(`${API_URL}/platform/workspaces/${workspaceId}/modules`, {
      headers: getAuthHeader()
    });
    return response.data;
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
    return response.data;
  },

  enterWorkspace: async (id: number) => {
    const response = await axios.post(`${API_URL}/platform/workspaces/${id}/enter`, null, {
      headers: getAuthHeader()
    });
    return response.data;
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
    return response.data;
  },
  updateSettings: async (settings: any) => {
    const response = await axios.put(`${API_URL}/platform/settings`, settings, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  getSupportRequests: async () => {
    const response = await axios.get(`${API_URL}/platform/support-requests`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  updateSupportRequest: async (requestId: number, data: any) => {
    const response = await axios.patch(`${API_URL}/platform/support-requests/${requestId}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  searchUserByEmail: async (email: string) => {
    const response = await axios.get(`${API_URL}/platform/users/search-by-email`, {
      params: { email },
      headers: getAuthHeader()
    });
    return response.data;
  },
  getEmailLogs: async (params?: any) => {
    const response = await axios.get(`${API_URL}/platform/email-logs`, {
      params,
      headers: getAuthHeader()
    });
    return response.data;
  }
};
