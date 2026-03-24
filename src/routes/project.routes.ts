import { Router } from 'express';
import { projectController } from '../controllers/ProjectController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';
import { requireEntitlement } from '../middleware/entitlementMiddleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * POST /api/projects
 * Create a new project (requires CREATE_PROJECT feature, enforces limit)
 */
router.post(
  '/',
  requireEntitlement('CREATE_PROJECT', 'project_count'),
  (req, res) => projectController.create(req, res)
);

/**
 * GET /api/projects
 * List all projects for tenant
 */
router.get('/', (req, res) => projectController.list(req, res));

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/:projectId', (req, res) => projectController.getById(req, res));

/**
 * PUT /api/projects/:projectId
 * Update project
 */
router.put('/:projectId', (req, res) => projectController.update(req, res));

/**
 * DELETE /api/projects/:projectId
 * Delete project (soft delete - archive)
 */
router.delete('/:projectId', (req, res) => projectController.delete(req, res));

export default router;
