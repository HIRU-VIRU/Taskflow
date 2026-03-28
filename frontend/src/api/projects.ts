import apiClient from './client';
import { Project, CreateProjectRequest, PaginatedResponse } from '../types';

export const projectsApi = {
  // List all projects for current tenant
  getProjects: async (page = 1, limit = 20, includeArchived = false): Promise<Project[]> => {
    const response = (await apiClient.get<any>('/projects', {
      params: { page, limit, includeArchived },
    })) as any;
    // Backend returns { projects: [...], pagination: {...} }
    return Array.isArray(response) ? response : response.projects || [];
  },

  // Paginated listing
  listProjects: async (page = 1, limit = 20, includeArchived = false): Promise<PaginatedResponse<Project>> => {
    const response = (await apiClient.get<any>('/projects', {
      params: { page, limit, includeArchived },
    })) as any;
    // Backend returns { projects: [...], pagination: {...} }
    return {
      data: response.projects || [],
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 20,
      total: response.pagination?.total || 0,
      totalPages: response.pagination?.totalPages || 1,
    };
  },

  // Get a specific project
  getProject: async (projectId: string): Promise<Project> => {
    const response = ((await apiClient.get<any>(`/projects/${projectId}`)) as any);
    // Backend returns { project: {...} }
    return response.project;
  },

  // Create a new project
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = ((await apiClient.post<any>('/projects', data)) as any);
    // Backend returns { project: {...} }
    return response.project;
  },

  // Update a project
  updateProject: async (projectId: string, data: Partial<CreateProjectRequest> & { status?: string }): Promise<Project> => {
    const response = ((await apiClient.put<any>(`/projects/${projectId}`, data)) as any);
    // Backend returns { project: {...} }
    return response.project;
  },

  // Delete/archive a project (soft delete)
  deleteProject: async (projectId: string): Promise<{ success: boolean }> => {
    const response = ((await apiClient.delete<any>(`/projects/${projectId}`)) as any);
    return response;
  },

  // Permanently delete a project (admin only)
  hardDeleteProject: async (projectId: string): Promise<{ success: boolean }> => {
    const response = ((await apiClient.delete<any>(`/projects/${projectId}/hard`)) as any);
    return response;
  },
};
