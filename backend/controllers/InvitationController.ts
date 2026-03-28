import { Request, Response } from 'express';
import { invitationService } from '../services/InvitationService';
import { tenantRepository } from '../repositories/TenantRepository';

export class InvitationController {
  /**
   * POST /api/invitations
   * Create a new invitation (admin only)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const { email, name, role } = req.body;

      if (!email || !name) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and name are required' },
        });
        return;
      }

      const invitation = await invitationService.createInvitation(tenantId, user.id, {
        email,
        name,
        role,
      });

      res.status(201).json({
        success: true,
        data: {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            name: invitation.name,
            role: invitation.role,
            status: invitation.status,
            expires_at: invitation.expires_at,
            created_at: invitation.created_at,
          },
        },
      });
    } catch (error) {
      const err = error as Error;
      console.error('[InvitationController] Create error:', err.message);

      if (err.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: err.message },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred while creating invitation' },
      });
    }
  }

  /**
   * GET /api/invitations/validate/:token
   * Validate an invitation token (public - no auth required)
   */
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Token is required' },
        });
        return;
      }

      const result = await invitationService.getInvitationByToken(token);

      if (!result) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invalid or expired invitation' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          invitation: {
            email: result.invitation.email,
            name: result.invitation.name,
            role: result.invitation.role,
            tenantName: result.tenantName,
          },
        },
      });
    } catch (error) {
      console.error('[InvitationController] Validate error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      });
    }
  }

  /**
   * POST /api/invitations/accept
   * Accept an invitation and create user account (public - no auth required)
   */
  async accept(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Token and password are required' },
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' },
        });
        return;
      }

      const result = await invitationService.acceptInvitation(token, password);

      res.status(200).json({
        success: true,
        data: {
          message: 'Invitation accepted successfully',
          user: result.user,
          tenant: result.tenant,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      const err = error as Error;
      console.error('[InvitationController] Accept error:', err.message);

      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INVITATION', message: err.message },
      });
    }
  }

  /**
   * GET /api/invitations
   * List pending invitations for tenant (admin only)
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const invitations = await invitationService.getPendingInvitations(user.tenantId);

      res.status(200).json({
        success: true,
        data: {
          invitations: invitations.map((inv) => ({
            id: inv.id,
            email: inv.email,
            name: inv.name,
            role: inv.role,
            status: inv.status,
            expires_at: inv.expires_at,
            created_at: inv.created_at,
          })),
        },
      });
    } catch (error) {
      console.error('[InvitationController] List error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      });
    }
  }

  /**
   * DELETE /api/invitations/:id
   * Cancel an invitation (admin only)
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      const deleted = await invitationService.cancelInvitation(user.tenantId, id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invitation not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Invitation cancelled successfully' },
      });
    } catch (error) {
      console.error('[InvitationController] Cancel error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      });
    }
  }

  /**
   * POST /api/invitations/:id/resend
   * Resend an invitation email (admin only)
   */
  async resend(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      await invitationService.resendInvitation(user.tenantId, id);

      res.status(200).json({
        success: true,
        data: { message: 'Invitation resent successfully' },
      });
    } catch (error) {
      const err = error as Error;
      console.error('[InvitationController] Resend error:', err.message);

      res.status(400).json({
        success: false,
        error: { code: 'RESEND_FAILED', message: err.message },
      });
    }
  }
}

export const invitationController = new InvitationController();
