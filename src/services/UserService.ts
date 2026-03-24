import { db } from '../config/database';
import { userRepository } from '../repositories/UserRepository';
import { usageTrackingRepository } from '../repositories/UsageTrackingRepository';
import { UserResponse } from '../types';

export class UserService {
  /**
   * Invite a new user to tenant
   * Entitlement check should be done at middleware level
   */
  async invite(
    tenantId: string,
    data: { email: string; name: string; role?: 'admin' | 'member' }
  ): Promise<UserResponse> {
    // Check if user already exists in tenant
    const existingUser = await userRepository.findByEmail(data.email, tenantId);
    if (existingUser) {
      throw new Error('User with this email already exists in this organization');
    }

    // Use transaction for atomicity
    return db.transaction(async (trx) => {
      // Create user with a temporary password (they would reset it)
      const user = await userRepository.create({
        email: data.email,
        name: data.name,
        password: Math.random().toString(36).slice(-12), // Temporary password
        role: data.role || 'member',
        tenant_id: tenantId,
      });

      // Increment user count
      await usageTrackingRepository.increment(tenantId, 'user_count', trx);

      return {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      };
    });
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
