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
      const { planId } = req.body;

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

      const subscription = await subscriptionService.assignPlan(tenantId, planId);

      res.status(200).json({
        success: true,
        data: { subscription },
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

      const subscription = await subscriptionService.getCurrentSubscription(tenantId);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No active subscription found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { subscription },
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
            priceMonthly: plan.price_monthly,
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
}

export const subscriptionController = new SubscriptionController();
