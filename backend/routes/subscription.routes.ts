import { Router } from 'express';
import { subscriptionController } from '../controllers/SubscriptionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/entitlementMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// All subscription routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * POST /api/subscriptions/assign
 * Assign/change subscription plan for tenant (admin only)
 */
router.post('/assign', adminOnly, (req, res) => subscriptionController.assign(req, res));

/**
 * GET /api/subscriptions/current
 * Get current subscription details
 */
router.get('/current', (req, res) => subscriptionController.getCurrent(req, res));

export default router;
