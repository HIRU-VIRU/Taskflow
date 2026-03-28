import { Request, Response } from 'express';
import { subscriptionService } from '../services/SubscriptionService';
import { planRepository } from '../repositories/PlanRepository';

export class SubscriptionController {
  /**
   * POST /api/subscriptions/assign
   * Assign/change subscription plan for tenant (admin only)
   */
  async assign(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { planId, billingCycle = 'monthly' } = req.body;

      if (!planId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'planId is required',
          },
        });
        return;
      }

      const subscription = await subscriptionService.assignPlan(tenantId, planId, undefined, billingCycle);

      // Fetch plan details to return complete subscription info
      const plan = await planRepository.findById(planId);
      const features = await planRepository.getFeatures(planId);
      const limits = await planRepository.getLimits(planId);

      // Return flat structure consistent with getCurrent
      res.status(200).json({
        success: true,
        data: {
          id: subscription.id,
          tenant_id: subscription.tenant_id,
          plan_id: subscription.plan_id,
          plan_name: plan?.name || '',
          status: subscription.status,
          expires_at: subscription.expires_at,
          created_at: subscription.created_at,
          updated_at: subscription.updated_at,
          features,
          limits,
        },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }

      if (err.message.includes('exceeds')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DOWNGRADE_NOT_ALLOWED',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while assigning the plan',
        },
      });
    }
  }

  /**
   * GET /api/subscriptions/current
   * Get current subscription details
   */
  async getCurrent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const subscriptionData = await subscriptionService.getCurrentSubscription(tenantId);

      if (!subscriptionData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No active subscription found',
          },
        });
        return;
      }

      // Return flat structure with subscription fields at top level
      res.status(200).json({
        success: true,
        data: {
          id: subscriptionData.subscription.id,
          tenant_id: subscriptionData.subscription.tenant_id,
          plan_id: subscriptionData.subscription.plan_id,
          plan_name: subscriptionData.planName,
          status: subscriptionData.subscription.status,
          expires_at: subscriptionData.subscription.expires_at,
          created_at: subscriptionData.subscription.created_at,
          updated_at: subscriptionData.subscription.updated_at,
          features: subscriptionData.features,
          limits: subscriptionData.limits,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the subscription',
        },
      });
    }
  }

  /**
   * GET /api/plans
   * List all available plans
   */
  async listPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await planRepository.findAllActive();

      // Get features and limits for each plan
      const plansWithDetails = await Promise.all(
        plans.map(async (plan) => {
          const features = await planRepository.getFeatures(plan.id);
          const limits = await planRepository.getLimits(plan.id);
          return {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            priceMonthly: parseFloat(plan.price_monthly.toString()),
            priceAnnual: parseFloat((plan.price_monthly * 12 * 0.95).toFixed(2)),
            features,
            limits,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: { plans: plansWithDetails },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching plans',
        },
      });
    }
  }
  /**
   * GET /api/subscriptions/billing-history
   * Get this tenant's billing events (payments, upgrades, etc.)
   */
  async getBillingHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const events = await subscriptionService.getBillingHistory(tenantId);
      res.status(200).json({ success: true, data: { events } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch billing history' },
      });
    }
  }

  /**
   * GET /api/subscriptions/usage-history?key=project_count&days=30
   * Get historical usage snapshots for graphing
   */
  async getUsageHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const usageKey = (req.query.key as string) || 'project_count';
      const days = Math.min(365, Math.max(7, parseInt(req.query.days as string) || 30));

      const snapshots = await subscriptionService.getUsageHistory(tenantId, usageKey, days);
      res.status(200).json({ success: true, data: { snapshots, usageKey, days } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch usage history' },
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
