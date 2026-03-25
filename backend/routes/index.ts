import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import subscriptionRoutes from './subscription.routes';
import planRoutes from './plan.routes';
import userRoutes from './user.routes';
import userSimpleRoutes from './user-simple.routes';
import tenantRoutes from './tenant.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import debugRoutes from './debug.routes';
import joinRoutes from './join.routes';
import { apiDocsController } from '../controllers/ApiDocsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/join', joinRoutes); // Public join endpoints
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes); // Public plans endpoint
router.use('/users', userRoutes);
router.use('/users-simple', userSimpleRoutes); // Simple test route
router.use('/tenants', tenantRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes); // Admin-only endpoints
router.use('/debug', debugRoutes); // Debug endpoints

// API Documentation (optional auth to show personalized docs)
router.get('/docs', (req, res, next) => {
  // Try to authenticate but don't require it
  authMiddleware(req, res, (err) => {
    // Continue regardless of auth result
    next();
  });
}, (req, res) => apiDocsController.getDocs(req, res));

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
