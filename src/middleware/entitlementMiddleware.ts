import { Request, Response, NextFunction } from 'express';
import { entitlementService } from '../services/EntitlementService';

/**
 * Entitlement Middleware Factory
 *
 * Creates middleware that checks:
 * 1. Subscription status (ACTIVE/EXPIRED)
 * 2. Feature access (CREATE_PROJECT, INVITE_USER, etc.)
 * 3. Usage limits (project_count, user_count)
 *
 * Usage:
 * router.post('/projects',
 *   authMiddleware,
 *   tenantContextMiddleware,
 *   requireEntitlement('CREATE_PROJECT', 'project_count'),
 *   projectController.create
 * );
 */
export const requireEntitlement = (feature: string, usageKey?: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.tenantContext) {
        res.status(403).json({
          success: false,
          error: {
            code: 'NO_TENANT_CONTEXT',
            message: 'Tenant context not found',
          },
        });
        return;
      }

      const tenantId = req.tenantContext.tenantId;

      // Call EntitlementService.check() - the central enforcement point
      const result = await entitlementService.check(tenantId, feature, usageKey);

      if (!result.allowed) {
        res.status(403).json({
          success: false,
          error: {
            code: result.code || 'ENTITLEMENT_DENIED',
            message: result.reason || 'Access denied',
          },
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error checking entitlement',
        },
      });
    }
  };
};

/**
 * Admin Only Middleware
 * Only allows users with 'admin' role
 */
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'This action requires admin privileges',
      },
    });
    return;
  }
  next();
};
