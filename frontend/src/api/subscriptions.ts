import apiClient from './client';
import { Plan, Subscription, BillingEvent, UsageSnapshot } from '../types';

export const subscriptionsApi = {
  // Get all available plans
  getPlans: async (): Promise<Plan[]> => {
    const response = ((await apiClient.get<any>('/plans')) as any);
    return Array.isArray(response) ? response : (response as any).plans || [];
  },

  // List plans (alias)
  listPlans: async (): Promise<Plan[]> => {
    const response = ((await apiClient.get<any>('/plans')) as any);
    return (response as any).plans || response;
  },

  // Get current subscription
  getCurrentSubscription: async (): Promise<Subscription> => {
    const response: any = ((await apiClient.get<any>('/subscriptions/current')) as any);
    console.log('🔍 Subscription API raw response:', response);

    // Handle both old nested format and new flat format
    // Old format from backend: { subscription: {...}, planName, features, limits }
    // New format from backend: { id, tenant_id, plan_id, plan_name, ... }

    // Check if it's the old nested format
    if (response?.subscription) {
      console.log('⚠️ Old nested format detected, flattening...');
      const sub = response.subscription;
      const flatSub: Subscription = {
        id: sub.id,
        tenant_id: sub.tenant_id,
        plan_id: sub.plan_id,
        plan_name: response.planName || sub.plan_name,
        status: sub.status,
        started_at: sub.started_at || sub.created_at, // provide required property
        expires_at: sub.expires_at,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        features: response.features || [],
        limits: response.limits || {},
      };
      console.log('✅ Flattened subscription:', flatSub);
      return flatSub;
    }

    // Already flat format
    console.log('✅ Flat format received:', response);
    return response as unknown as Subscription;
  },

  // Assign a new plan to the tenant
  assignPlan: async (planId: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Promise<Subscription> => {
    const response: any = ((await apiClient.post<any>('/subscriptions/assign', { planId, billingCycle })) as any);
    console.log('🔍 AssignPlan API response:', response);

    // Handle both old nested format and new flat format
    if (response?.subscription) {
      const sub = response.subscription;
      return {
        id: sub.id,
        tenant_id: sub.tenant_id,
        plan_id: sub.plan_id,
        plan_name: response.planName || sub.plan_name,
        status: sub.status,
        started_at: sub.started_at || sub.created_at, // provide required property
        expires_at: sub.expires_at,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        features: response.features || [],
        limits: response.limits || {},
      } as Subscription;
    }

    return response as unknown as Subscription;
  },

  // Get billing history (events ledger)
  getBillingHistory: async (): Promise<BillingEvent[]> => {
    const response: any = ((await apiClient.get<any>('/subscriptions/billing-history')) as any);
    return response.events || [];
  },

  // Get usage history (snapshots)
  getUsageHistory: async (key: string, days: number = 30): Promise<UsageSnapshot[]> => {
    const response: any = ((await apiClient.get<any>(`/subscriptions/usage-history?key=${key}&days=${days}`)) as any);
    return response.snapshots || [];
  },
};

