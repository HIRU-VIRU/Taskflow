import apiClient from './client';
import { Project, CreateProjectRequest, PaginatedResponse } from '../types';

export const projectsApi = {
  // List all projects for current tenant
  getProjects: async (page = 1, limit = 20): Promise<Project[]> => {
    const response = await apiClient.get('/projects', {
      params: { page, limit },
    });
    return Array.isArray(response) ? response : response.data || [];
  },

  // Paginated listing
  listProjects: async (page = 1, limit = 20): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get('/projects', {
      params: { page, limit },
    });
    return response;
  },

  // Get a specific project
  getProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response;
  },

  // Create a new project
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response;
  },

  // Update a project
  updateProject: async (projectId: string, data: Partial<CreateProjectRequest> & { status?: string }): Promise<Project> => {
    const response = await apiClient.put(`/projects/${projectId}`, data);
    return response;
  },

  // Delete/archive a project
  deleteProject: async (projectId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response;
  },
};
