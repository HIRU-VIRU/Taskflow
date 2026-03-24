import { db } from '../config/database';
import { Subscription, SubscriptionStatus } from '../types';
import { Knex } from 'knex';

export class SubscriptionRepository {
  private tableName = 'subscriptions';

  async create(data: {
    tenant_id: string;
    plan_id: string;
    status?: SubscriptionStatus;
    expires_at?: Date | null;
  }, trx?: Knex.Transaction): Promise<Subscription> {
    const query = trx ? trx(this.tableName) : db(this.tableName);
    const [subscription] = await query
      .insert({
        tenant_id: data.tenant_id,
        plan_id: data.plan_id,
        status: data.status || 'ACTIVE',
        started_at: db.fn.now(),
        expires_at: data.expires_at || null,
      })
      .returning('*');
    return subscription;
  }

  async findActiveByTenantId(tenantId: string): Promise<Subscription | null> {
    const subscription = await db(this.tableName)
      .where({ tenant_id: tenantId, status: 'ACTIVE' })
      .first();
    return subscription || null;
  }

  async findByTenantId(tenantId: string): Promise<Subscription[]> {
    return db(this.tableName)
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await db(this.tableName).where({ id }).first();
    return subscription || null;
  }

  async updateStatus(id: string, status: SubscriptionStatus, trx?: Knex.Transaction): Promise<Subscription | null> {
    const query = trx ? trx(this.tableName) : db(this.tableName);
    const [subscription] = await query
      .where({ id })
      .update({ status, updated_at: db.fn.now() })
      .returning('*');
    return subscription || null;
  }

  async getActiveSubscriptionWithPlan(tenantId: string): Promise<{
    subscription: Subscription;
    plan_name: string;
    plan_id: string;
  } | null> {
    const result = await db(this.tableName)
      .join('plans', 'subscriptions.plan_id', 'plans.id')
      .where({
        'subscriptions.tenant_id': tenantId,
        'subscriptions.status': 'ACTIVE',
      })
      .select(
        'subscriptions.*',
        'plans.name as plan_name'
      )
      .first();

    if (!result) return null;

    return {
      subscription: {
        id: result.id,
        tenant_id: result.tenant_id,
        plan_id: result.plan_id,
        status: result.status,
        started_at: result.started_at,
        expires_at: result.expires_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      plan_name: result.plan_name,
      plan_id: result.plan_id,
    };
  }

  async cancelCurrentAndCreateNew(
    tenantId: string,
    newPlanId: string,
    expiresAt?: Date | null
  ): Promise<Subscription> {
    return db.transaction(async (trx) => {
      // Cancel current active subscription
      await trx(this.tableName)
        .where({ tenant_id: tenantId, status: 'ACTIVE' })
        .update({ status: 'CANCELLED', updated_at: trx.fn.now() });

      // Create new subscription
      const [newSubscription] = await trx(this.tableName)
        .insert({
          tenant_id: tenantId,
          plan_id: newPlanId,
          status: 'ACTIVE',
          started_at: trx.fn.now(),
          expires_at: expiresAt || null,
        })
        .returning('*');

      return newSubscription;
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
