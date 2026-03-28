import { db } from '../config/database';
import { invitationRepository, Invitation } from '../repositories/InvitationRepository';
import { userRepository } from '../repositories/UserRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { tenantRepository } from '../repositories/TenantRepository';
import { emailService } from './EmailService';
import { authService } from './AuthService';

export interface CreateInvitationInput {
  email: string;
  name: string;
  role?: 'admin' | 'member';
}

export class InvitationService {
  /**
   * Create a new invitation and send email
   */
  async createInvitation(
    tenantId: string,
    invitedBy: string,
    data: CreateInvitationInput
  ): Promise<Invitation> {
    // Check if user already exists in tenant
    const existingUser = await userRepository.findByEmail(data.email, tenantId);
    if (existingUser) {
      throw new Error('User with this email already exists in this organization');
    }

    // Check if pending invitation exists
    const existingInvitation = await invitationRepository.findByEmail(data.email, tenantId);
    if (existingInvitation) {
      throw new Error('A pending invitation already exists for this email');
    }

    // Create the invitation
    const invitation = await invitationRepository.create({
      tenant_id: tenantId,
      email: data.email,
      name: data.name,
      role: data.role,
      invited_by: invitedBy,
    });

    // Send email (or log to console if SMTP not configured)
    const tenant = await tenantRepository.findById(tenantId);
    if (tenant) {
      await emailService.sendInvitation(invitation, tenant);
    }

    return invitation;
  }

  /**
   * Validate and accept an invitation
   */
  async acceptInvitation(
    token: string,
    password: string
  ): Promise<{ user: any; tenant: any; tenantSlug: string; accessToken: string }> {
    const invitation = await invitationRepository.findByToken(token);

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status === 'accepted') {
      throw new Error('This invitation has already been accepted');
    }

    if (new Date() > new Date(invitation.expires_at)) {
      throw new Error('This invitation has expired');
    }

    // Get tenant for returning slug
    const tenant = await tenantRepository.findById(invitation.tenant_id);
    if (!tenant) {
      throw new Error('Organization not found');
    }

    // Use transaction for atomicity
    return db.transaction(async (trx) => {
      // Create the user
      const user = await userRepository.create(
        {
          email: invitation.email,
          name: invitation.name,
          password: password,
          role: invitation.role,
          tenant_id: invitation.tenant_id,
        },
        trx
      );

      // Mark invitation as accepted
      await invitationRepository.markAsAccepted(invitation.id, trx);

      // Increment user count for usage tracking
      await usageTrackingRepository.increment(invitation.tenant_id, 'user_count', trx);

      // Generate access token for automatic login
      const accessToken = authService.generateToken({
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        tenantSlug: tenant.slug,
        accessToken,
      };
    });
  }

  /**
   * Get invitation details by token (for validation page)
   */
  async getInvitationByToken(token: string): Promise<{
    invitation: Invitation;
    tenantName: string;
  } | null> {
    const invitation = await invitationRepository.findByToken(token);

    if (!invitation) return null;
    if (invitation.status === 'accepted') return null;
    if (new Date() > new Date(invitation.expires_at)) return null;

    const tenant = await tenantRepository.findById(invitation.tenant_id);

    return {
      invitation,
      tenantName: tenant?.name || 'Unknown Organization',
    };
  }

  /**
   * Get all pending invitations for a tenant
   */
  async getPendingInvitations(tenantId: string): Promise<Invitation[]> {
    return invitationRepository.findPendingByTenant(tenantId);
  }

  /**
   * Cancel/delete an invitation
   */
  async cancelInvitation(tenantId: string, invitationId: string): Promise<boolean> {
    return invitationRepository.deleteById(invitationId, tenantId);
  }

  /**
   * Resend an invitation email
   */
  async resendInvitation(tenantId: string, invitationId: string): Promise<boolean> {
    const invitation = await invitationRepository.findById(invitationId);

    if (!invitation || invitation.tenant_id !== tenantId) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Can only resend pending invitations');
    }

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error('Organization not found');
    }

    return emailService.sendInvitation(invitation, tenant);
  }
}

export const invitationService = new InvitationService();
