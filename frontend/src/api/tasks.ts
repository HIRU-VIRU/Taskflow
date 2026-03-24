import apiClient from './client';
import { Task, CreateTaskRequest, PaginatedResponse } from '../types';

export const tasksApi = {
  // Get all tasks for a project
  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`);
    return Array.isArray(response) ? response : response.data || [];
  },

  // List tasks for a specific project (paginated)
  listTasks: async (
    projectId: string,
    page = 1,
    limit = 20,
    filters?: { status?: string; assignee_id?: string }
  ): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`, {
      params: { page, limit, ...filters },
    });
    return response;
  },

  // Get a specific task
  getTask: async (projectId: string, taskId: string): Promise<Task> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}`);
    return response;
  },

  // Create a new task
  createTask: async (projectId: string, data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, data);
    return response;
  },

  // Update a task
  updateTask: async (projectId: string, taskId: string, data: Partial<CreateTaskRequest>): Promise<Task> => {
    const response = await apiClient.put(`/projects/${projectId}/tasks/${taskId}`, data);
    return response;
  },

  // Delete a task
  deleteTask: async (projectId: string, taskId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response;
  },
};
