import apiClient from './client';
import { Task, CreateTaskRequest, PaginatedResponse } from '../types';

export const tasksApi = {
  // Get all tasks for a project
  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const response: any = ((await apiClient.get<any>(`/projects/${projectId}/tasks`)) as any);
    return Array.isArray(response) ? response : response.tasks || [];
  },

  // Get all tasks for the current tenant
  getTenantTasks: async (): Promise<Task[]> => {
    const response: any = ((await apiClient.get<any>('/tasks')) as any);
    return Array.isArray(response) ? response : response.tasks || [];
  },

  // List tasks for a specific project (paginated)
  listTasks: async (
    projectId: string,
    page = 1,
    limit = 20,
    filters?: { status?: string; assignee_id?: string }
  ): Promise<PaginatedResponse<Task>> => {
    const response: any = await apiClient.get<any>(`/projects/${projectId}/tasks`, {
      params: { page, limit, ...filters },
    });
    return {
      data: response.tasks || [],
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    } as any;
  },

  // Get a specific task
  getTask: async (projectId: string, taskId: string): Promise<Task> => {
    const response: any = ((await apiClient.get<any>(`/projects/${projectId}/tasks/${taskId}`)) as any);
    return response.task;
  },

  // Create a new task
  createTask: async (projectId: string, data: CreateTaskRequest): Promise<Task> => {
    const response: any = ((await apiClient.post<any>(`/projects/${projectId}/tasks`, data)) as any);
    return response.task;
  },

  // Update a task
  updateTask: async (projectId: string, taskId: string, data: Partial<CreateTaskRequest>): Promise<Task> => {
    const response: any = ((await apiClient.put<any>(`/projects/${projectId}/tasks/${taskId}`, data)) as any);
    return response.task;
  },

  // Delete a task
  deleteTask: async (projectId: string, taskId: string): Promise<{ success: boolean }> => {
    const response: any = ((await apiClient.delete<any>(`/projects/${projectId}/tasks/${taskId}`)) as any);
    return response;
  },
};
