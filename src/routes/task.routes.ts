import { Router } from 'express';
import { taskController } from '../controllers/TaskController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';
import { requireEntitlement } from '../middleware/entitlementMiddleware';

const router = Router({ mergeParams: true }); // mergeParams to access :projectId from parent

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * POST /api/projects/:projectId/tasks
 * Create a task in a project (requires CREATE_TASK feature)
 */
router.post(
  '/',
  requireEntitlement('CREATE_TASK'),
  (req, res) => taskController.create(req, res)
);

/**
 * GET /api/projects/:projectId/tasks
 * List tasks in a project
 */
router.get('/', (req, res) => taskController.list(req, res));

/**
 * GET /api/projects/:projectId/tasks/:taskId
 * Get task details
 */
router.get('/:taskId', (req, res) => taskController.getById(req, res));

/**
 * PUT /api/projects/:projectId/tasks/:taskId
 * Update task
 */
router.put('/:taskId', (req, res) => taskController.update(req, res));

/**
 * DELETE /api/projects/:projectId/tasks/:taskId
 * Delete task
 */
router.delete('/:taskId', (req, res) => taskController.delete(req, res));

export default router;
