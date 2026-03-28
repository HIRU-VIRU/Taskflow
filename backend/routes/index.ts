import { Router } from 'express';
import { db } from '../config/database';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import teamRoutes from './team.routes';
import subscriptionRoutes from './subscription.routes';
import planRoutes from './plan.routes';
import userRoutes from './user.routes';
import userSimpleRoutes from './user-simple.routes';
import tenantRoutes from './tenant.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import debugRoutes from './debug.routes';
import aiRoutes from './ai.routes';
import invitationRoutes from './invitation.routes';
import platformRoutes from './platform.routes';
import { taskController } from '../controllers/TaskController';

import { apiDocsController } from '../controllers/ApiDocsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/invitations', invitationRoutes); // Invitation system (email-only)
router.use('/teams', teamRoutes); // Team management
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/tasks', taskRoutes);
router.use('/tasks', authMiddleware, tenantContextMiddleware, (req, res, next) => {
  const params = req.params as any;
  if (req.method === 'GET' && !params.projectId) {
    taskController.listByTenant(req, res);
    return;
  }
  next();
});
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes); // Public plans endpoint
router.use('/users', userRoutes);
router.use('/users-simple', userSimpleRoutes); // Simple test route
router.use('/tenants', tenantRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes); // Admin-only endpoints
router.use('/debug', debugRoutes); // Debug endpoints
router.use('/ai', aiRoutes); // AI-powered features
router.use('/platform', platformRoutes); // Platform Admin (Super Owner)

// API Documentation (optional auth to show personalized docs)
router.get('/docs', (req, res, next) => {
  // Try to authenticate but don't require it
  authMiddleware(req, res, (err) => {
    // Continue regardless of auth result
    next();
  });
}, (req, res) => apiDocsController.getDocs(req, res));

// Health check
router.get('/health', async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
  });
});

export default router;
