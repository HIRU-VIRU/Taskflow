import { db } from '../config/database';
import { userRepository } from '../repositories/UserRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { invitationService } from './InvitationService';
import { UserResponse } from '../types';

export class UserService {
  /**
   * Invite a new user to tenant - now creates invitation instead of user
   * Entitlement check should be done at middleware level
   */
  async invite(
    tenantId: string,
    invitedBy: string,
    data: { email: string; name: string; role?: 'admin' | 'member' }
  ): Promise<any> {
    // Delegate to invitation service
    return invitationService.createInvitation(tenantId, invitedBy, data);
  }

  /**
   * List all users in tenant
   */
  async list(tenantId: string): Promise<UserResponse[]> {
    return this.getAll(tenantId);
  }

  /**
   * Get all users in tenant
   */
  async getAll(tenantId: string): Promise<UserResponse[]> {
    return userRepository.findByTenantId(tenantId);
  }

  /**
   * Get user by ID
   */
  async getById(tenantId: string, userId: string): Promise<UserResponse | null> {
    const user = await userRepository.findById(userId);
    if (!user || user.tenant_id !== tenantId) {
      return null;
    }
    return {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Update user profile
   */
  async update(
    tenantId: string,
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<UserResponse | null> {
    // Check if email already exists (if updating email)
    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email, tenantId);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('User with this email already exists in this organization');
      }
    }

    const updatedUser = await userRepository.update(userId, tenantId, data);

    if (!updatedUser) {
      return null;
    }

    return {
      id: updatedUser.id,
      tenant_id: updatedUser.tenant_id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
    };
  }

  /**
   * Remove user from tenant
   */
  async remove(tenantId: string, userId: string): Promise<boolean> {
    return db.transaction(async (trx) => {
      const deleted = await trx('users')
        .where({ id: userId, tenant_id: tenantId })
        .del();

      if (deleted > 0) {
        await usageTrackingRepository.decrement(tenantId, 'user_count', trx);
      }

      return deleted > 0;
    });
  }

  /**
   * Get user count
   */
  async getCount(tenantId: string): Promise<number> {
    return userRepository.countByTenantId(tenantId);
  }
}

export const userService = new UserService();
