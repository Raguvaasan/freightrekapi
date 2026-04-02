import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getHubDashboard } from '../../controllers/hub/dashboard.controller';

const router = Router();

router.use(authMiddleware);

// GET /hub/dashboard
router.get('/', getHubDashboard);

export default router;
