import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import subscriptionRoutes from './subscription.routes';
import userRoutes from './user.routes';
import tenantRoutes from './tenant.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', subscriptionRoutes); // Also mount plans at /api/plans
router.use('/users', userRoutes);
router.use('/tenants', tenantRoutes);
router.use('/analytics', analyticsRoutes);

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
