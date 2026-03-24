import { Request, Response, NextFunction } from 'express';
import { tenantRepository } from '../repositories/TenantRepository';

/**
 * Tenant Context Middleware
 * - Loads user's tenant from DB
 * - Attaches tenantContext to request
 * - Must run after authMiddleware
 */
export const tenantContextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    const tenantId = req.user.tenantId;

    // Load tenant details
    const tenant = await tenantRepository.findById(tenantId);

    if (!tenant) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found',
        },
      });
      return;
    }

    // Attach tenant context to request
    req.tenantContext = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error loading tenant context',
      },
    });
  }
};
