import { Router } from 'express';
import { invitationController } from '../controllers/InvitationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminOnly, requireEntitlement } from '../middleware/entitlementMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// =============================================
// PUBLIC ROUTES (no authentication required)
// =============================================

// Validate an invitation token
router.get('/validate/:token', (req, res) => invitationController.validate(req, res));

// Accept an invitation and create account
router.post('/accept', (req, res) => invitationController.accept(req, res));

// =============================================
// PROTECTED ROUTES (authentication required)
// =============================================

router.use(authMiddleware);
router.use(tenantContextMiddleware);

// List pending invitations (admin only)
router.get('/', adminOnly, (req, res) => invitationController.list(req, res));

// Create invitation (admin only, requires INVITE_USER feature)
router.post(
  '/',
  adminOnly,
  requireEntitlement('INVITE_USER', 'user_count'),
  (req, res) => invitationController.create(req, res)
);

// Cancel an invitation (admin only)
router.delete('/:id', adminOnly, (req, res) => invitationController.cancel(req, res));

// Resend an invitation (admin only)
router.post('/:id/resend', adminOnly, (req, res) => invitationController.resend(req, res));

export default router;
