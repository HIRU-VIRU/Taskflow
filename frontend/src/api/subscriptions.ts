import apiClient from './client';
import { Plan, Subscription } from '../types';

export const subscriptionsApi = {
  // Get all available plans
  getPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/plans');
    return Array.isArray(response) ? response : response.data || [];
  },

  // List plans (alias)
  listPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/plans');
    return response;
  },

  // Get current subscription
  getCurrentSubscription: async (): Promise<Subscription> => {
    const response = await apiClient.get('/subscriptions/current');
    return response;
  },

  // Assign a new plan to the tenant
  assignPlan: async (planId: string): Promise<Subscription> => {
    const response = await apiClient.post('/subscriptions/assign', { planId });
    return response;
  },
};
