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

  getAuditLogs: async () => {
    const response = await axios.get(`${API_URL}/platform/audit-logs`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};
