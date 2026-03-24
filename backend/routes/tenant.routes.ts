import { Router } from 'express';
import { tenantController } from '../controllers/TenantController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/entitlementMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * GET /api/tenants/current
 * Get current tenant details
 */
router.get('/current', (req, res) => tenantController.getCurrent(req, res));

/**
 * PUT /api/tenants/current
 * Update current tenant details (admin only)
 */
router.put('/current', adminOnly, (req, res) => tenantController.update(req, res));

export default router;
