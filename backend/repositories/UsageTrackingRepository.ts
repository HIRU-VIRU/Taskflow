import { db } from '../config/database';
import { UsageTracking } from '../types';
import { Knex } from 'knex';

export class UsageTrackingRepository {
  private tableName = 'usage_tracking';

  async getUsage(tenantId: string, usageKey: string): Promise<number> {
    const usage = await db(this.tableName)
      .where({ tenant_id: tenantId, usage_key: usageKey })
      .first();
    return usage?.current_value || 0;
  }

  async getAllUsage(tenantId: string): Promise<Record<string, number>> {
    const usages = await db(this.tableName)
      .where({ tenant_id: tenantId })
      .select('usage_key', 'current_value');
    return usages.reduce((acc, u) => {
      acc[u.usage_key] = u.current_value;
      return acc;
    }, {} as Record<string, number>);
  }

  async increment(
    tenantId: string,
    usageKey: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const query = trx || db;

    // Use upsert pattern with row locking
    const existing = await query(this.tableName)
      .where({ tenant_id: tenantId, usage_key: usageKey })
      .forUpdate()
      .first();

    if (existing) {
      const [updated] = await query(this.tableName)
        .where({ tenant_id: tenantId, usage_key: usageKey })
        .increment('current_value', 1)
        .update({ updated_at: query.fn.now() })
        .returning('current_value');
      return updated.current_value;
    } else {
      await query(this.tableName).insert({
        tenant_id: tenantId,
        usage_key: usageKey,
        current_value: 1,
      });
      return 1;
    }
  }

  async decrement(
    tenantId: string,
    usageKey: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const query = trx || db;

    const existing = await query(this.tableName)
      .where({ tenant_id: tenantId, usage_key: usageKey })
      .forUpdate()
      .first();

    if (existing && existing.current_value > 0) {
      const [updated] = await query(this.tableName)
        .where({ tenant_id: tenantId, usage_key: usageKey })
        .decrement('current_value', 1)
        .update({ updated_at: query.fn.now() })
        .returning('current_value');
      return updated.current_value;
    }
    return 0;
  }

  async setUsage(
    tenantId: string,
    usageKey: string,
    value: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const query = trx || db;

    const existing = await query(this.tableName)
      .where({ tenant_id: tenantId, usage_key: usageKey })
      .first();

    if (existing) {
      await query(this.tableName)
        .where({ tenant_id: tenantId, usage_key: usageKey })
        .update({ current_value: value, updated_at: query.fn.now() });
    } else {
      await query(this.tableName).insert({
        tenant_id: tenantId,
        usage_key: usageKey,
        current_value: value,
      });
    }
  }

  async initializeUsage(tenantId: string, trx?: Knex.Transaction): Promise<void> {
    const query = trx || db;
    await query(this.tableName).insert([
      { tenant_id: tenantId, usage_key: 'project_count', current_value: 0 },
      { tenant_id: tenantId, usage_key: 'user_count', current_value: 1 }, // Start with 1 for admin user
    ]);
  }
}

export const usageTrackingRepository = new UsageTrackingRepository();
