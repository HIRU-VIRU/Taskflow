import { Router } from 'express';
import { subscriptionController } from '../controllers/SubscriptionController';

const router = Router();

/**
 * GET /api/plans
 * List all available plans (public - no authentication required)
 */
router.get('/', (req, res) => subscriptionController.listPlans(req, res));

export default router;