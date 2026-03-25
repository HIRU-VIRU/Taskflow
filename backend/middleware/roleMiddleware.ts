import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control Middleware
 * Ensures user has required role(s) to access endpoint
 */
export const requireRole = (allowedRoles: ('admin' | 'member')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!allowedRoles.includes(user.role as 'admin' | 'member')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${user.role}`,
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
          message: 'Authorization error',
        },
      });
    }
  };
};

/**
 * Admin-only access middleware
 * Shorthand for requireRole(['admin'])
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Any authenticated user access middleware
 * Allows both admin and member roles
 */
export const requireAuth = requireRole(['admin', 'member']);

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources (or admin can access all)
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Admin can access any resource
      if (user.role === 'admin') {
        next();
        return;
      }

      // Regular users can only access their own resources
      const targetUserId = req.params[userIdParam];
      if (targetUserId && targetUserId !== user.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own resources',
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
          message: 'Authorization error',
        },
      });
    }
  };
};