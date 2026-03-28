import { db } from '../config/database';
import { Knex } from 'knex';
import crypto from 'crypto';

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string | null;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInvitationData {
  tenant_id: string;
  email: string;
  name: string;
  role?: 'admin' | 'member';
  invited_by?: string;
}

export class InvitationRepository {
  /**
   * Create a new invitation with generated token
   */
  async create(data: CreateInvitationData, trx?: Knex.Transaction): Promise<Invitation> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const query = (trx || db)('invitations')
      .insert({
        tenant_id: data.tenant_id,
        email: data.email.toLowerCase(),
        name: data.name,
        role: data.role || 'member',
        token,
        invited_by: data.invited_by,
        expires_at: expiresAt,
        status: 'pending',
      })
      .returning('*');

    const [invitation] = await query;
    return invitation;
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    const invitation = await db('invitations').where({ token }).first();
    return invitation || null;
  }

  /**
   * Find pending invitation by email for a specific tenant
   */
  async findByEmail(email: string, tenantId: string): Promise<Invitation | null> {
    const invitation = await db('invitations')
      .where({ email: email.toLowerCase(), tenant_id: tenantId, status: 'pending' })
      .first();
    return invitation || null;
  }

  /**
   * Mark invitation as accepted
   */
  async markAsAccepted(id: string, trx?: Knex.Transaction): Promise<void> {
    await (trx || db)('invitations')
      .where({ id })
      .update({
        status: 'accepted',
        accepted_at: new Date(),
        updated_at: new Date(),
      });
  }

  /**
   * Get all pending invitations for a tenant
   */
  async findPendingByTenant(tenantId: string): Promise<Invitation[]> {
    return db('invitations')
      .where({ tenant_id: tenantId, status: 'pending' })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');
  }

  /**
   * Delete an invitation
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await db('invitations').where({ id }).del();
    return deleted > 0;
  }

  /**
   * Delete invitation by ID (for cancellation)
   */
  async deleteById(id: string, tenantId: string): Promise<boolean> {
    const deleted = await db('invitations')
      .where({ id, tenant_id: tenantId })
      .del();
    return deleted > 0;
  }

  /**
   * Find invitation by ID
   */
  async findById(id: string): Promise<Invitation | null> {
    const invitation = await db('invitations').where({ id }).first();
    return invitation || null;
  }
}

export const invitationRepository = new InvitationRepository();
