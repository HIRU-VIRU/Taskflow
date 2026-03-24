import { Request, Response } from 'express';
import { userService } from '../services/UserService';

export class UserController {
  /**
   * POST /api/users/invite
   * Invite a new user to tenant (requires INVITE_USER feature)
   */
  async invite(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { email, name, role } = req.body;

      if (!email || !name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and name are required',
          },
        });
        return;
      }

      const user = await userService.invite(tenantId, { email, name, role });

      res.status(201).json({
        success: true,
        data: { user },
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

      if (err.message.includes('USAGE_LIMIT_EXCEEDED')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'USAGE_LIMIT_EXCEEDED',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while inviting the user',
        },
      });
    }
  }

  /**
   * GET /api/users
   * List all users in tenant
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const users = await userService.list(tenantId);

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching users',
        },
      });
    }
  }

  /**
   * GET /api/users/:userId
   * Get user details
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.params.userId;

      const user = await userService.getById(tenantId, userId);

      if (!user) {
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
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the user',
        },
      });
    }
  }

  /**
   * DELETE /api/users/:userId
   * Remove user from tenant (admin only)
   */
  async remove(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.params.userId;
      const currentUserId = req.user!.id;

      if (userId === currentUserId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'You cannot remove yourself',
          },
        });
        return;
      }

      const success = await userService.remove(tenantId, userId);

      if (!success) {
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
        data: { message: 'User removed successfully' },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while removing the user',
        },
      });
    }
  }
}

export const userController = new UserController();
