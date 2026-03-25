import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// All admin routes require authentication, tenant context, and admin role
router.use(authMiddleware);
router.use(tenantContextMiddleware);
router.use(requireAdmin); // Admin only routes

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));

/**
 * GET /api/admin/users
 * Get detailed user management view
 */
router.get('/users', (req, res) => adminController.getUserManagement(req, res));

/**
 * POST /api/admin/users/:userId/promote
 * Promote user to admin
 */
router.post('/users/:userId/promote', (req, res) => adminController.promoteUser(req, res));

/**
 * POST /api/admin/users/:userId/demote
 * Demote admin to regular member
 */
router.post('/users/:userId/demote', (req, res) => adminController.demoteUser(req, res));

export default router;