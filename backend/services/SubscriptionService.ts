import { subscriptionRepository } from '../repositories/SubscriptionRepository';
import { planRepository } from '../repositories/PlanRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { billingRepository } from '../repositories/BillingRepository';
import { entitlementService } from './EntitlementService';
import { Plan, Subscription, BillingEvent, UsageSnapshot } from '../types';

export class SubscriptionService {
  /**
   * Get current subscription with plan details
   */
  async getCurrentSubscription(tenantId: string): Promise<{
    subscription: Subscription;
    planName: string;
    features: string[];
    limits: Record<string, number>;
  } | null> {
    const result = await subscriptionRepository.getActiveSubscriptionWithPlan(tenantId);
    if (!result) return null;

    const features = await planRepository.getFeatures(result.plan_id);
    const limits = await planRepository.getLimits(result.plan_id);

    return {
      subscription: result.subscription,
      planName: result.plan_name,
      features,
      limits,
    };
  }

  /**
   * Get all available plans
   */
  async getAvailablePlans(): Promise<
    Array<Plan & { features: string[]; limits: Record<string, number> }>
  > {
    return planRepository.getPlansWithDetails();
  }

  /**
   * Assign/change subscription plan
   */
  async assignPlan(
    tenantId: string,
    planId: string,
    expiresAt?: Date,
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<Subscription> {
    // If expiresAt is not provided, calculate it based on billing cycle
    if (!expiresAt) {
      const currentDate = new Date();
      if (billingCycle === 'annual') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 30);
      }
      expiresAt = currentDate;
    }
    // Verify plan exists
    const plan = await planRepository.findById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check if downgrading and usage exceeds new limits
    const currentUsage = await usageTrackingRepository.getAllUsage(tenantId);
    const newLimits = await planRepository.getLimits(planId);

    // Check project limit
    const projectLimit = newLimits['max_projects'];
    const currentProjects = currentUsage['project_count'] || 0;
    if (projectLimit !== -1 && currentProjects > projectLimit) {
      throw new Error(
        `Cannot downgrade: You have ${currentProjects} projects but the new plan only allows ${projectLimit}. Please archive some projects first.`
      );
    }

    // Check user limit
    const userLimit = newLimits['max_users'];
    const currentUsers = currentUsage['user_count'] || 0;
    if (userLimit !== -1 && currentUsers > userLimit) {
      throw new Error(
        `Cannot downgrade: You have ${currentUsers} users but the new plan only allows ${userLimit}. Please remove some users first.`
      );
    }

    // Cancel current and create new subscription
    const newSubscription = await subscriptionRepository.cancelCurrentAndCreateNew(
      tenantId,
      planId,
      expiresAt || null
    );

    // Invalidate entitlement cache
    entitlementService.invalidateTenantCache(tenantId);

    return newSubscription;
  }

  /**
   * Get subscription history
   */
  async getHistory(tenantId: string): Promise<Subscription[]> {
    return subscriptionRepository.findByTenantId(tenantId);
  }

  /**
   * Get usage summary
   */
  async getUsageSummary(tenantId: string): Promise<{
    usage: Record<string, number>;
    limits: Record<string, number>;
    remaining: Record<string, number>;
  }> {
    const subscription = await subscriptionRepository.getActiveSubscriptionWithPlan(tenantId);
    if (!subscription) {
      return { usage: {}, limits: {}, remaining: {} };
    }

    const usage = await usageTrackingRepository.getAllUsage(tenantId);
    const limits = await planRepository.getLimits(subscription.plan_id);

    const remaining: Record<string, number> = {};
    for (const key of Object.keys(limits)) {
      const usageKey = this.limitKeyToUsageKey(key);
      if (limits[key] === -1) {
        remaining[key] = -1; // Unlimited
      } else {
        remaining[key] = Math.max(0, limits[key] - (usage[usageKey] || 0));
      }
    }

    return { usage, limits, remaining };
  }

  private limitKeyToUsageKey(limitKey: string): string {
    const mapping: Record<string, string> = {
      max_projects: 'project_count',
      max_users: 'user_count',
    };
    return mapping[limitKey] || limitKey;
  }

  /**
   * Get billing history for the tenant (events ledger)
   */
  async getBillingHistory(tenantId: string): Promise<BillingEvent[]> {
    return billingRepository.getBillingHistory(tenantId, 50);
  }

  /**
   * Get usage history for a specific key over N days
   * usageKey: 'project_count' | 'user_count'
   */
  async getUsageHistory(
    tenantId: string,
    usageKey: string,
    days = 30
  ): Promise<UsageSnapshot[]> {
    return billingRepository.getUsageHistory(tenantId, usageKey, days);
  }
}

export const subscriptionService = new SubscriptionService();
