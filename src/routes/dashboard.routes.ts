import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getFranchiseDashboard } from '../controllers/dashboard.controller';

const router = Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get franchise dashboard data
 * @access  Private (Franchise only)
 */
router.get('/', authMiddleware, getFranchiseDashboard);

export default router;
