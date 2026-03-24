import apiClient from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  // Register a new tenant and admin user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response;
  },

  // Login with email, password, and tenant slug
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response;
  },

  // Get current authenticated user info
  getMe: async (): Promise<{ user: any; tenant: any }> => {
    const response = await apiClient.get('/auth/me');
    return response;
  },
};
