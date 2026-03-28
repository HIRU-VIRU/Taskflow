import { Router } from 'express';
import { teamController } from '../controllers/TeamController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';
import { requireEntitlement } from '../middleware/entitlementMiddleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * POST /api/teams
 * Create a new team (admin only)
 */
router.post(
  '/',
  requireEntitlement('CREATE_TEAM'),
  (req, res) => teamController.create(req, res)
);

/**
 * GET /api/teams
 * List all teams for the tenant
 */
router.get('/', (req, res) => teamController.list(req, res));

/**
 * GET /api/teams/my-teams
 * Get teams the current user belongs to
 */
router.get('/my-teams', (req, res) => teamController.getMyTeams(req, res));

/**
 * GET /api/teams/:teamId
 * Get team details
 */
router.get('/:teamId', (req, res) => teamController.getById(req, res));

/**
 * PUT /api/teams/:teamId
 * Update team (admin only)
 */
router.put('/:teamId', (req, res) => teamController.update(req, res));

/**
 * DELETE /api/teams/:teamId
 * Delete team (admin only)
 */
router.delete('/:teamId', (req, res) => teamController.delete(req, res));

/**
 * GET /api/teams/:teamId/members
 * Get team members
 */
router.get('/:teamId/members', (req, res) => teamController.getMembers(req, res));

/**
 * POST /api/teams/:teamId/members
 * Add member to team (admin or team leader)
 */
router.post('/:teamId/members', (req, res) => teamController.addMember(req, res));

/**
 * DELETE /api/teams/:teamId/members/:userId
 * Remove member from team (admin or team leader)
 */
router.delete('/:teamId/members/:userId', (req, res) => teamController.removeMember(req, res));

export default router;