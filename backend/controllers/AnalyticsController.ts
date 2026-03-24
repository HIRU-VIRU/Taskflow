import { Request, Response } from 'express';
import { analyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Get analytics data (requires VIEW_ANALYTICS feature)
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const analytics = await analyticsService.getDashboard(tenantId);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching analytics',
        },
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
