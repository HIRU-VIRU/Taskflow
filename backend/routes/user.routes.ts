import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminOnly, requireEntitlement } from '../middleware/entitlementMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * POST /api/users/invite
 * Invite a new user to tenant (requires INVITE_USER feature)
 */
router.post(
  '/invite',
  adminOnly,
  requireEntitlement('INVITE_USER', 'user_count'),
  (req, res) => userController.invite(req, res)
);

/**
 * GET /api/users
 * List all users in tenant
 */
router.get('/', (req, res) => userController.list(req, res));

/**
 * GET /api/users/:userId
 * Get user details
 */
router.get('/:userId', (req, res) => userController.getById(req, res));

/**
 * DELETE /api/users/:userId
 * Remove user from tenant (admin only)
 */
router.delete('/:userId', adminOnly, (req, res) => userController.remove(req, res));

export default router;
