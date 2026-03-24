import apiClient from './client';
import { User, InviteUserRequest } from '../types';

export const usersApi = {
  // Get all users in the tenant
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return Array.isArray(response) ? response : response.data || [];
  },

  // List all users in the tenant
  listUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response;
  },

  // Get a specific user
  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response;
  },

  // Invite a new user to the tenant
  inviteUser: async (data: InviteUserRequest): Promise<User> => {
    const response = await apiClient.post('/users/invite', data);
    return response;
  },

  // Remove a user from the tenant
  removeUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response;
  },
};
