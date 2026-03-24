import { subscriptionRepository } from '../repositories/SubscriptionRepository';
import { planRepository } from '../repositories/PlanRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { EntitlementResult } from '../types';

/**
 * CRITICAL: Central Entitlement Service
 *
 * This service is the single point of enforcement for all subscription logic.
 * All feature access, usage limits, and subscription status checks go through this service.
 *
 * EntitlementService.check(tenantId, feature, usageKey)
 */
export class EntitlementService {
  // Simple in-memory cache (in production, use Redis)
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Central entitlement check method
   * @param tenantId - The tenant performing the action
   * @param feature - Feature code to check (e.g., 'CREATE_PROJECT')
   * @param usageKey - Optional usage limit key (e.g., 'project_count')
   * @returns { allowed: boolean, reason?: string, code?: string }
   */
  async check(
    tenantId: string,
    feature: string,
    usageKey?: string
  ): Promise<EntitlementResult> {
    // STEP 1: Check subscription status
    const subscriptionCheck = await this.checkSubscriptionStatus(tenantId);
    if (!subscriptionCheck.allowed) {
      return subscriptionCheck;
    }

    // STEP 2: Check feature access
    const featureCheck = await this.checkFeatureAccess(
      tenantId,
      subscriptionCheck.planId!,
      feature
    );
    if (!featureCheck.allowed) {
      return featureCheck;
    }

    // STEP 3: Check usage limit (if usageKey provided)
    if (usageKey) {
      const usageCheck = await this.checkUsageLimit(
        tenantId,
        subscriptionCheck.planId!,
        usageKey
      );
      if (!usageCheck.allowed) {
        return usageCheck;
      }
    }

    return { allowed: true };
  }

  /**
   * STEP 1: Check subscription status (ACTIVE/EXPIRED)
   */
  private async checkSubscriptionStatus(tenantId: string): Promise<
    EntitlementResult & { planId?: string }
  > {
    // Try cache first
    const cacheKey = `subscription:${tenantId}`;
    const cached = this.getFromCache<{ id: string; planId: string; expiresAt: Date | null }>(cacheKey);

    let subscription: { id: string; planId: string; expiresAt: Date | null };
    if (cached) {
      subscription = cached;
    } else {
      const result = await subscriptionRepository.getActiveSubscriptionWithPlan(tenantId);

      if (!result) {
        return {
          allowed: false,
          code: 'SUBSCRIPTION_NOT_FOUND',
          reason: 'No active subscription found. Please subscribe to a plan.',
        };
      }

      subscription = {
        id: result.subscription.id,
        planId: result.plan_id,
        expiresAt: result.subscription.expires_at,
      };

      // Cache the subscription
      this.setCache(cacheKey, subscription);
    }

    // Check if subscription has expired
    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      // Update subscription status to EXPIRED
      await subscriptionRepository.updateStatus(subscription.id, 'EXPIRED');
      // Invalidate cache
      this.invalidateCache(cacheKey);

      return {
        allowed: false,
        code: 'SUBSCRIPTION_EXPIRED',
        reason: 'Your subscription has expired. Please renew to continue.',
      };
    }

    return { allowed: true, planId: subscription.planId };
  }

  /**
   * STEP 2: Check feature access
   */
  private async checkFeatureAccess(
    tenantId: string,
    planId: string,
    featureCode: string
  ): Promise<EntitlementResult> {
    // Try cache first
    const cacheKey = `features:${planId}`;
    let features = this.getFromCache<string[]>(cacheKey);

    if (!features) {
      features = await planRepository.getFeatures(planId);
      this.setCache(cacheKey, features);
    }

    if (!features.includes(featureCode)) {
      return {
        allowed: false,
        code: 'FEATURE_NOT_ALLOWED',
        reason: `Your current plan does not include this feature. Please upgrade to access ${featureCode.toLowerCase().replace('_', ' ')}.`,
      };
    }

    return { allowed: true };
  }

  /**
   * STEP 3: Check usage limit
   */
  private async checkUsageLimit(
    tenantId: string,
    planId: string,
    usageKey: string
  ): Promise<EntitlementResult> {
    // Get limit from plan
    const limitKey = this.usageKeyToLimitKey(usageKey);

    // Try cache first for limits
    const cacheKey = `limits:${planId}`;
    let limits = this.getFromCache<Record<string, number>>(cacheKey);

    if (!limits) {
      limits = await planRepository.getLimits(planId);
      this.setCache(cacheKey, limits);
    }

    const limitValue = limits[limitKey];

    // If limit is -1, it's unlimited
    if (limitValue === -1 || limitValue === undefined) {
      return { allowed: true };
    }

    // Get current usage (not cached - needs to be real-time)
    const currentUsage = await usageTrackingRepository.getUsage(tenantId, usageKey);

    if (currentUsage >= limitValue) {
      return {
        allowed: false,
        code: 'USAGE_LIMIT_EXCEEDED',
        reason: `You have reached the maximum ${usageKey.replace('_', ' ')} (${limitValue}) for your plan. Please upgrade to create more.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Convert usage key to limit key
   * e.g., 'project_count' -> 'max_projects'
   */
  private usageKeyToLimitKey(usageKey: string): string {
    const mapping: Record<string, string> = {
      project_count: 'max_projects',
      user_count: 'max_users',
    };
    return mapping[usageKey] || usageKey;
  }

  /**
   * Check if tenant has a specific feature (convenience method)
   */
  async hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
    const result = await this.check(tenantId, featureCode);
    return result.allowed;
  }

  /**
   * Get remaining usage for a limit
   */
  async getRemainingUsage(
    tenantId: string,
    usageKey: string
  ): Promise<{ current: number; limit: number; remaining: number }> {
    const subscription = await subscriptionRepository.getActiveSubscriptionWithPlan(tenantId);
    if (!subscription) {
      return { current: 0, limit: 0, remaining: 0 };
    }

    const limitKey = this.usageKeyToLimitKey(usageKey);
    const limit = await planRepository.getLimit(subscription.plan_id, limitKey);
    const current = await usageTrackingRepository.getUsage(tenantId, usageKey);

    // -1 means unlimited
    if (limit === -1 || limit === null) {
      return { current, limit: -1, remaining: -1 };
    }

    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
    };
  }

  /**
   * Invalidate cache for a tenant (call on subscription change)
   */
  invalidateTenantCache(tenantId: string): void {
    this.invalidateCache(`subscription:${tenantId}`);
  }

  /**
   * Invalidate cache for a plan (call on plan change)
   */
  invalidatePlanCache(planId: string): void {
    this.invalidateCache(`features:${planId}`);
    this.invalidateCache(`limits:${planId}`);
  }

  // Simple cache helpers
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL_MS,
    });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }
}

export const entitlementService = new EntitlementService();
