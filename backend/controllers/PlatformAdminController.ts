import { Request, Response } from 'express';
import { platformAdminService } from '../services/PlatformAdminService';

export class PlatformAdminController {
  /** POST /api/platform/auth/login — public */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
        });
        return;
      }

      const result = await platformAdminService.login(email, password);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: error.message || 'Invalid credentials' },
      });
    }
  }

  /** GET /api/platform/me — returns current platform admin info */
  async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: { platformAdmin: req.platformAdmin },
    });
  }

  /** GET /api/platform/stats — aggregated platform metrics (cached 2 min) */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await platformAdminService.getPlatformStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch platform stats' },
      });
    }
  }

  /**
   * GET /api/platform/tenants
   * Paginated, sorted, filtered tenant list.
   * ?page=1&limit=20&sortBy=user_count&order=desc&plan=Pro&search=acme
   */
  async getTenants(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const sortBy = (['name', 'user_count', 'project_count', 'created_at'].includes(
        req.query.sortBy as string
      )
        ? req.query.sortBy
        : 'created_at') as 'name' | 'user_count' | 'project_count' | 'created_at';
      const order = req.query.order === 'asc' ? 'asc' : 'desc';
      const plan = req.query.plan as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await platformAdminService.getTenants({
        page,
        limit,
        sortBy,
        order,
        plan: plan || undefined,
        search: search || undefined,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tenants' },
      });
    }
  }

  /** GET /api/platform/tenants/:tenantId — single tenant deep-dive */
  async getTenantDetail(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const detail = await platformAdminService.getTenantDetail(tenantId);

      if (!detail) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        });
        return;
      }

      res.status(200).json({ success: true, data: detail });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tenant detail' },
      });
    }
  }

  /**
   * GET /api/platform/revenue-history
   * Monthly revenue aggregation for the past N months.
   * ?months=12
   */
  async getRevenueHistory(req: Request, res: Response): Promise<void> {
    try {
      const months = Math.min(36, Math.max(1, parseInt(req.query.months as string) || 12));
      const data = await platformAdminService.getRevenueHistory(months);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch revenue history' },
      });
    }
  }
}

export const platformAdminController = new PlatformAdminController();
