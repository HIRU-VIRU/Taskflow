import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';

/**
 * Authentication Middleware
 * - Validates JWT token
 * - Extracts userId and tenantId
 * - Attaches user info to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No valid authorization token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      const payload = authService.verifyToken(token);

      // Attach user info to request
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      };

      next();
    } catch {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
    });
  }
};
