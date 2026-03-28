import apiClient from './client';
import { User, InviteUserRequest } from '../types';

export const usersApi = {
  // Get all users in the tenant
  getUsers: async (): Promise<User[]> => {
    const response = ((await apiClient.get<any>('/users')) as any);
    // API client already extracts data field, so response is { users: [...] }
    return Array.isArray(response) ? response : response.users || [];
  },

  // List all users in the tenant
  listUsers: async (): Promise<User[]> => {
    const response = ((await apiClient.get<any>('/users')) as any);
    return Array.isArray(response) ? response : response.users || [];
  },

  // Get a specific user
  getUser: async (userId: string): Promise<User> => {
    const response = ((await apiClient.get<any>(`/users/${userId}`)) as any);
    return response;
  },

  // Invite a new user to the tenant
  inviteUser: async (data: InviteUserRequest): Promise<User> => {
    const response = ((await apiClient.post<any>('/users/invite', data)) as any);
    return response;
  },

  // Remove a user from the tenant
  removeUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = ((await apiClient.delete<any>(`/users/${userId}`)) as any);
    return response;
  },
};
