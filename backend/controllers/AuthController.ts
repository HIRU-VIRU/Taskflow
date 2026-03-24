import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { RegisterDTO, LoginDTO } from '../types';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new tenant with admin user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data: RegisterDTO = req.body;

      // Validate required fields
      if (!data.tenantName || !data.tenantSlug || !data.adminEmail || !data.adminPassword || !data.adminName) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required: tenantName, tenantSlug, adminEmail, adminPassword, adminName',
          },
        });
        return;
      }

      const result = await authService.register(data);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during registration',
        },
      });
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const data: LoginDTO = req.body;

      // Validate required fields
      if (!data.email || !data.password || !data.tenantSlug) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required: email, password, tenantSlug',
          },
        });
        return;
      }

      const result = await authService.login(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: err.message || 'Invalid credentials',
        },
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      });
    }
  }
}

export const authController = new AuthController();
