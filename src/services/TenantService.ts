import { tenantRepository } from '../repositories/TenantRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { subscriptionService } from './SubscriptionService';
import { Tenant } from '../types';

export class TenantService {
  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant | null> {
    return tenantRepository.findById(id);
  }

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string): Promise<Tenant | null> {
    return tenantRepository.findBySlug(slug);
  }

  /**
   * Get tenant info (alias for getDetails)
   */
  async getTenantInfo(tenantId: string): Promise<{
    tenant: Tenant;
    subscription: {
      planName: string;
      status: string;
      expiresAt: Date | null;
    } | null;
    usage: Record<string, number>;
  } | null> {
    return this.getDetails(tenantId);
  }

  /**
   * Get tenant details with subscription and usage
   */
  async getDetails(tenantId: string): Promise<{
    tenant: Tenant;
    subscription: {
      planName: string;
      status: string;
      expiresAt: Date | null;
    } | null;
    usage: Record<string, number>;
  } | null> {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) return null;

    const subscriptionData = await subscriptionService.getCurrentSubscription(tenantId);
    const usage = await usageTrackingRepository.getAllUsage(tenantId);

    return {
      tenant,
      subscription: subscriptionData
        ? {
            planName: subscriptionData.planName,
            status: subscriptionData.subscription.status,
            expiresAt: subscriptionData.subscription.expires_at,
          }
        : null,
      usage,
    };
  }

  /**
   * Update tenant
   */
  async update(id: string, data: { name?: string }): Promise<Tenant | null> {
    return tenantRepository.update(id, data);
  }
}

export const tenantService = new TenantService();
