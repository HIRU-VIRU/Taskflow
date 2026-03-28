import { platformAdminRepository } from '../repositories/PlatformAdminRepository';
import { billingRepository } from '../repositories/BillingRepository';
import { db } from '../config/database';
import { authService } from './AuthService';
import { PlatformStats, TenantSummary, RevenueDataPoint } from '../types';

type SortBy = 'name' | 'user_count' | 'project_count' | 'created_at';
type SortOrder = 'asc' | 'desc';

export interface TenantsQuery {
  page: number;
  limit: number;
  sortBy: SortBy;
  order: SortOrder;
  plan?: string;
  search?: string;
}

export class PlatformAdminService {
  // ── In-memory cache (2-minute TTL) ───────────────────────────────────────
  private cache = new Map<string, { data: unknown; expiry: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // ── Auth ─────────────────────────────────────────────────────────────────

  async login(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    admin: Omit<import('../types').PlatformAdmin, 'password_hash'>;
  }> {
    const admin = await platformAdminRepository.findByEmail(email);
    if (!admin) throw new Error('Invalid credentials');

    const isValid = await platformAdminRepository.verifyPassword(admin, password);
    if (!isValid) throw new Error('Invalid credentials');

    // Embed role: 'platform_admin' so platformAuthMiddleware can distinguish
    const accessToken = authService.generateToken({
      userId: admin.id,
      tenantId: 'PLATFORM', // sentinel — platform admins don't belong to any tenant
      email: admin.email,
      role: 'platform_admin',
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
      },
    };
  }

  // ── Platform Stats (cached) ───────────────────────────────────────────────

  async getPlatformStats(): Promise<PlatformStats> {
    const cacheKey = 'platform_stats';
    const cached = this.fromCache<PlatformStats>(cacheKey);
    if (cached) return cached;

    const [
      tenantRow,
      userRow,
      projectRow,
      taskRow,
      subscriptionBreakdownRows,
      revenueSummary,
      newTenantsRow,
      mrrRow,
    ] = await Promise.all([
      db('tenants').count('id as c').first(),
      db('users').count('id as c').first(),
      db('projects').count('id as c').first(),
      db('tasks').count('id as c').first(),
      db('subscriptions as s')
        .join('plans as p', 's.plan_id', 'p.id')
        .where('s.status', 'ACTIVE')
        .select('p.name as plan')
        .count('s.id as cnt')
        .groupBy('p.name'),
      billingRepository.getPlatformRevenueSummary(),
      db('tenants')
        .where('created_at', '>=', db.raw("date_trunc('month', CURRENT_DATE)"))
        .count('id as c')
        .first(),
      db('subscriptions as s')
        .join('plans as p', 's.plan_id', 'p.id')
        .where('s.status', 'ACTIVE')
        .sum('p.price_monthly as mrr')
        .first(),
    ]);

    const subscriptionBreakdown: Record<string, number> = {};
    (subscriptionBreakdownRows as any[]).forEach((r) => {
      subscriptionBreakdown[r.plan] = parseInt(r.cnt) || 0;
    });

    const stats: PlatformStats = {
      totalTenants: parseInt((tenantRow as any)?.c) || 0,
      totalUsers: parseInt((userRow as any)?.c) || 0,
      totalProjects: parseInt((projectRow as any)?.c) || 0,
      totalTasks: parseInt((taskRow as any)?.c) || 0,
      subscriptionBreakdown,
      estimatedMRR: parseFloat((mrrRow as any)?.mrr) || 0,
      newTenantsThisMonth: parseInt((newTenantsRow as any)?.c) || 0,
      revenueSummary,
    };

    this.toCache(cacheKey, stats);
    return stats;
  }

  // ── Tenants (paginated + sorted + filtered) ───────────────────────────────

  async getTenants(query: TenantsQuery): Promise<{
    tenants: TenantSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sortBy, order, plan, search } = query;
    const offset = (page - 1) * limit;

    // Build subqueries for aggregated counts
    const userCounts = db('users')
      .select('tenant_id')
      .count('id as user_count')
      .groupBy('tenant_id')
      .as('uc');

    const projectCounts = db('projects')
      .select('tenant_id')
      .count('id as project_count')
      .groupBy('tenant_id')
      .as('pc');

    const baseQuery = db('tenants as t')
      .leftJoin('subscriptions as s', function () {
        this.on('s.tenant_id', '=', 't.id').andOnIn('s.status', ['ACTIVE']);
      })
      .leftJoin('plans as p', 's.plan_id', 'p.id')
      .leftJoin(userCounts, 'uc.tenant_id', 't.id')
      .leftJoin(projectCounts, 'pc.tenant_id', 't.id')
      .select(
        't.id',
        't.name',
        't.slug',
        't.created_at',
        db.raw("COALESCE(p.name, 'No Plan') as plan"),
        db.raw('COALESCE(p.price_monthly, 0) as plan_price'),
        db.raw("COALESCE(s.status, 'INACTIVE') as status"),
        db.raw('COALESCE(uc.user_count, 0)::int as user_count'),
        db.raw('COALESCE(pc.project_count, 0)::int as project_count')
      );

    if (plan) baseQuery.where('p.name', plan);
    if (search) baseQuery.whereILike('t.name', `%${search}%`);

    // Count total (clone before pagination)
    const countQ = baseQuery.clone().clearSelect().count('t.id as c').first();
    const countResult = (await countQ) as any;
    const total = parseInt(countResult?.c) || 0;

    const colMap: Record<string, string> = {
      name: 't.name',
      user_count: 'user_count',
      project_count: 'project_count',
      created_at: 't.created_at',
    };

    const rows = (await baseQuery
      .orderBy(colMap[sortBy] || 't.created_at', order)
      .limit(limit)
      .offset(offset)) as any[];

    return {
      tenants: rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        plan: r.plan,
        planPrice: parseFloat(r.plan_price) || 0,
        status: r.status,
        userCount: r.user_count,
        projectCount: r.project_count,
        createdAt: r.created_at,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Tenant Detail ─────────────────────────────────────────────────────────

  async getTenantDetail(tenantId: string): Promise<any> {
    const tenant = (await db('tenants as t')
      .leftJoin('subscriptions as s', function () {
        this.on('s.tenant_id', '=', 't.id').andOnIn('s.status', ['ACTIVE']);
      })
      .leftJoin('plans as p', 's.plan_id', 'p.id')
      .where('t.id', tenantId)
      .select(
        't.*',
        db.raw("COALESCE(p.name, 'No Plan') as plan_name"),
        db.raw('COALESCE(p.price_monthly, 0) as plan_price'),
        db.raw("COALESCE(s.status, 'INACTIVE') as subscription_status"),
        's.started_at',
        's.expires_at'
      )
      .first()) as any;

    if (!tenant) return null;

    const [userRow, projectRow, taskRow, recentBilling] = await Promise.all([
      db('users').where({ tenant_id: tenantId }).count('id as c').first(),
      db('projects').where({ tenant_id: tenantId }).count('id as c').first(),
      db('tasks').where({ tenant_id: tenantId }).count('id as c').first(),
      billingRepository.getBillingHistory(tenantId, 10),
    ]);

    return {
      ...tenant,
      userCount: parseInt((userRow as any)?.c) || 0,
      projectCount: parseInt((projectRow as any)?.c) || 0,
      taskCount: parseInt((taskRow as any)?.c) || 0,
      recentBilling,
    };
  }

  // ── Revenue History (cached) ──────────────────────────────────────────────

  async getRevenueHistory(months = 12): Promise<RevenueDataPoint[]> {
    const cacheKey = `revenue_history_${months}`;
    const cached = this.fromCache<RevenueDataPoint[]>(cacheKey);
    if (cached) return cached;

    const rows = await billingRepository.getMonthlyRevenue(months);
    const result = this.fillMissingMonths(rows, months);
    this.toCache(cacheKey, result);
    return result;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private fillMissingMonths(
    rows: Array<{ month: string; revenue: string; tenant_count: string }>,
    months: number
  ): RevenueDataPoint[] {
    const map = new Map<string, RevenueDataPoint>();
    rows.forEach((r) =>
      map.set(r.month, {
        month: r.month,
        revenue: parseFloat(r.revenue) || 0,
        tenantCount: parseInt(r.tenant_count) || 0,
      })
    );

    const result: RevenueDataPoint[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push(map.get(key) ?? { month: key, revenue: 0, tenantCount: 0 });
    }
    return result;
  }

  invalidateCache(): void {
    this.cache.clear();
  }

  private fromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) return entry.data as T;
    this.cache.delete(key);
    return null;
  }

  private toCache(key: string, data: unknown): void {
    this.cache.set(key, { data, expiry: Date.now() + this.CACHE_TTL });
  }
}

export const platformAdminService = new PlatformAdminService();
