import { Router } from 'express';
import { analyticsController } from '../controllers/AnalyticsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';
import { requireEntitlement } from '../middleware/entitlementMiddleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * GET /api/analytics/dashboard
 * Get analytics data (requires VIEW_ANALYTICS feature)
 */
router.get(
  '/dashboard',
  requireEntitlement('VIEW_ANALYTICS'),
  (req, res) => analyticsController.getDashboard(req, res)
);

export default router;
