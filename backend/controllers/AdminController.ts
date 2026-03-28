import { Request, Response } from 'express';
import { userService } from '../services/UserService';
import { subscriptionService } from '../services/SubscriptionService';
import { analyticsService } from '../services/AnalyticsService';

export class AdminController {
  /**
   * GET /api/admin/dashboard
   * Get admin dashboard statistics
   * ADMIN ONLY
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;

      const [userCount, subscriptionData, analytics] = await Promise.all([
        userService.getCount(tenantId),
        subscriptionService.getCurrentSubscription(tenantId),
        analyticsService.getDashboard(tenantId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          tenant: {
            id: tenantId,
            userCount,
          },
          subscription: subscriptionData ? {
            plan: subscriptionData.planName,
            status: subscriptionData.subscription.status,
            expires_at: subscriptionData.subscription.expires_at,
            limits: subscriptionData.limits,
          } : null,
          projects: {
            total: analytics.projectCount,
          },
          analytics: {
            tasksByStatus: analytics.tasksByStatus,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching dashboard data',
        },
      });
    }
  }

  /**
   * GET /api/admin/users
   * Get detailed user management view
   * ADMIN ONLY
   */
  async getUserManagement(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;

      const users = await userService.list(tenantId);

      res.status(200).json({
        success: true,
        data: {
          users: users.map(u => ({
            ...u,
            isCurrentUser: u.id === user.id,
            canDelete: u.id !== user.id, // Can't delete self
          })),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching user management data',
        },
      });
    }
  }

  /**
   * POST /api/admin/users/:userId/promote
   * Promote user to admin
   * ADMIN ONLY
   */
  async promoteUser(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const userId = req.params.userId;

      if (userId === user.id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'You cannot modify your own role',
          },
        });
        return;
      }

      const updatedUser = await userService.update(tenantId, userId, { role: 'admin' } as any);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'User promoted to admin successfully',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while promoting the user',
        },
      });
    }
  }

  /**
   * POST /api/admin/users/:userId/demote
   * Demote admin to regular member
   * ADMIN ONLY
   */
  async demoteUser(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const userId = req.params.userId;

      if (userId === user.id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'You cannot modify your own role',
          },
        });
        return;
      }

      const updatedUser = await userService.update(tenantId, userId, { role: 'member' } as any);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'User demoted to member successfully',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while demoting the user',
        },
      });
    }
  }
}

export const adminController = new AdminController();