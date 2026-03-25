import { Request, Response } from 'express';
import { userService } from '../services/UserService';

export class UserController {
  /**
   * POST /api/users/invite
   * Invite a new user to tenant (requires INVITE_USER feature)
   * ADMIN ONLY endpoint
   */
  async invite(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!; // Properly typed now
      const tenantId = user.tenantId;
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

      const newUser = await userService.invite(tenantId, { email, name, role });

      res.status(201).json({
        success: true,
        data: { user: newUser },
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
   * Available to both admin and members
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;

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
   * Users can only view their own profile, admins can view any user
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const userId = req.params.userId;

      // Check if user can access this profile
      if (user.role !== 'admin' && user.id !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own profile',
          },
        });
        return;
      }

      const targetUser = await userService.getById(tenantId, userId);

      if (!targetUser) {
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
        data: { user: targetUser },
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
   * PUT /api/users/:userId
   * Update user profile
   * Users can only update their own profile, admins can update any user
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const userId = req.params.userId;
      const { name, email } = req.body;

      // Check if user can update this profile
      if (user.role !== 'admin' && user.id !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile',
          },
        });
        return;
      }

      const updatedUser = await userService.update(tenantId, userId, { name, email });

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
        data: { user: updatedUser },
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Email already exists',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the user',
        },
      });
    }
  }

  /**
   * DELETE /api/users/:userId
   * Remove user from tenant (ADMIN ONLY)
   */
  async remove(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const userId = req.params.userId;
      const currentUserId = user.id;

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
