import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';

/**
 * Platform Admin Authentication Middleware
 *
 * Validates a JWT and ensures its role is 'platform_admin'.
 * Completely separate from the tenant authMiddleware — tenant JWTs are rejected here.
 */
export const platformAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No authorization token provided' },
      });
      return;
    }

    const token = authHeader.substring(7);

    let payload: ReturnType<typeof authService.verifyToken>;
    try {
      payload = authService.verifyToken(token);
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
      });
      return;
    }

    if (payload.role !== 'platform_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'PLATFORM_ADMIN_REQUIRED',
          message: 'This endpoint requires platform admin access',
        },
      });
      return;
    }

    req.platformAdmin = { id: payload.userId, email: payload.email };
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Authentication error' },
    });
  }
};
