import { Router } from 'express';
import { aiController } from '../controllers/AIController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireEntitlement } from '../middleware/entitlementMiddleware';
import { tenantContextMiddleware } from '../middleware/tenantContextMiddleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantContextMiddleware);

/**
 * POST /api/ai/summarize-project/:projectId
 * Generate AI-powered project summary
 * Requires AI_SUMMARIZER feature (Pro/Enterprise) or 1 free demo usage
 * Usage limit: Free = 1 time, Pro/Enterprise = unlimited
 */
router.post(
  '/summarize-project/:projectId',
  requireEntitlement('AI_SUMMARIZER', 'ai_summary_count'),
  (req, res) => aiController.summarizeProject(req, res)
);

/**
 * GET /api/ai/health
 * Check if AI service is available
 * Public endpoint (no entitlement required)
 */
router.get('/health', (req, res) => aiController.healthCheck(req, res));

export default router;
