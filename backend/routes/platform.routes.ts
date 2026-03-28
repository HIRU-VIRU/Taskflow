import { Router } from 'express';
import { platformAdminController } from '../controllers/PlatformAdminController';
import { platformAuthMiddleware } from '../middleware/platformAuthMiddleware';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/auth/login', (req, res) => platformAdminController.login(req, res));

// ── Protected — all require a valid platform_admin JWT ────────────────────────
router.use(platformAuthMiddleware);

router.get('/me', (req, res) => platformAdminController.getMe(req, res));
router.get('/stats', (req, res) => platformAdminController.getStats(req, res));
router.get('/revenue-history', (req, res) => platformAdminController.getRevenueHistory(req, res));
router.get('/tenants', (req, res) => platformAdminController.getTenants(req, res));
router.get('/tenants/:tenantId', (req, res) => platformAdminController.getTenantDetail(req, res));

export default router;
