import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/users-simple
 * List all users in tenant (simple auth only for testing)
 */
router.get('/simple', authMiddleware, (req, res) => userController.list(req, res));

export default router;