import apiClient from './client';
import { Plan } from '../types';

export const plansApi = {
  /**
   * Get all available plans (public endpoint)
   */
  async getPlans(): Promise<Plan[]> {
    // The apiClient interceptor already extracts response.data.data
    // So we get { plans: Plan[] } directly
    const response: { plans: Plan[] } = ((await apiClient.get<any>('/plans')) as any);
    return response.plans;
  },
};
