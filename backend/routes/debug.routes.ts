import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// Debug route to test middleware chain
router.get('/test-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      hasUser: !!req.user,
      userId: req.user?.id,
      role: req.user?.role,
    },
  });
});

router.get('/test-tenant', authMiddleware, tenantContextMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      tenantContext: req.tenantContext,
      hasUser: !!req.user,
      hasTenant: !!req.tenantContext,
    },
  });
});

export default router;