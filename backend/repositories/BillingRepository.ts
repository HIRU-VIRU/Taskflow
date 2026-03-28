import { db } from '../config/database';
import { BillingEvent, UsageSnapshot } from '../types';

export class BillingRepository {
  // ── Tenant-facing billing history ────────────────────────────────────────

  async getBillingHistory(tenantId: string, limit = 50): Promise<BillingEvent[]> {
    return db('billing_events as be')
      .leftJoin('plans as p', 'be.plan_id', 'p.id')
      .where('be.tenant_id', tenantId)
      .orderBy('be.created_at', 'desc')
      .limit(limit)
      .select(
        'be.*',
        db.raw("COALESCE(p.name, '') as plan_name")
      );
  }

  async getUsageHistory(
    tenantId: string,
    usageKey: string,
    days = 30
  ): Promise<UsageSnapshot[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return db('usage_snapshots')
      .where({ tenant_id: tenantId, usage_key: usageKey })
      .where('snapshot_date', '>=', since.toISOString().split('T')[0])
      .orderBy('snapshot_date', 'asc');
  }

  // ── Platform admin revenue aggregation ────────────────────────────────────

  async getMonthlyRevenue(
    months = 12
  ): Promise<Array<{ month: string; revenue: string; tenant_count: string }>> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    return db('billing_events')
      .where('event_type', 'payment')
      .where('created_at', '>=', since)
      .select(
        db.raw("TO_CHAR(created_at, 'YYYY-MM') as month"),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(DISTINCT tenant_id) as tenant_count')
      )
      .groupByRaw("TO_CHAR(created_at, 'YYYY-MM')")
      .orderBy('month', 'asc');
  }

  async getPlatformRevenueSummary(): Promise<{
    this_month: number;
    last_month: number;
    total_revenue: number;
  }> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonth, lastMonth, total] = await Promise.all([
      db('billing_events')
        .where('event_type', 'payment')
        .where('created_at', '>=', thisMonthStart)
        .sum('amount as t')
        .first(),
      db('billing_events')
        .where('event_type', 'payment')
        .where('created_at', '>=', lastMonthStart)
        .where('created_at', '<', thisMonthStart)
        .sum('amount as t')
        .first(),
      db('billing_events')
        .where('event_type', 'payment')
        .sum('amount as t')
        .first(),
    ]);

    return {
      this_month: parseFloat((thisMonth as any)?.t) || 0,
      last_month: parseFloat((lastMonth as any)?.t) || 0,
      total_revenue: parseFloat((total as any)?.t) || 0,
    };
  }

  // ── Write methods ─────────────────────────────────────────────────────────

  async createEvent(data: Partial<BillingEvent>): Promise<BillingEvent> {
    const [event] = await db('billing_events').insert(data).returning('*');
    return event;
  }

  async upsertSnapshot(data: {
    tenant_id: string;
    usage_key: string;
    value: number;
    snapshot_date: string;
  }): Promise<void> {
    await db('usage_snapshots')
      .insert(data)
      .onConflict(['tenant_id', 'usage_key', 'snapshot_date'])
      .merge({ value: data.value });
  }
}

export const billingRepository = new BillingRepository();
