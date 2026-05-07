import apiClient from './apiClient';

export const operationsApi = {
  listStages: async (jobId: number) => {
    const response = await apiClient.get(`/jobs/${jobId}/stages`);
    return response.data;
  },
  createStage: async (jobId: number, data: any) => {
    const response = await apiClient.post(`/jobs/${jobId}/stages`, data);
    return response.data;
  },
  updateStage: async (jobId: number, stageId: number, data: any) => {
    const response = await apiClient.put(`/jobs/${jobId}/stages/${stageId}`, data);
    return response.data;
  },
  deleteStage: async (jobId: number, stageId: number) => {
    const response = await apiClient.delete(`/jobs/${jobId}/stages/${stageId}`);
    return response.data;
  },
  applyTemplate: async (jobId: number, templateName: string) => {
    const response = await apiClient.post(`/jobs/${jobId}/stages/apply-template`, { template_name: templateName });
    return response.data;
  }
};
