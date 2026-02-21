import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import {
  getAdminDashboard,
  getTopFranchises,
  getWalletStatistics,
  getOrdersStatistics,
} from '../../controllers/admin/dashboard.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /admin/dashboard
 * @desc    Get admin dashboard statistics (aggregated across all franchises)
 * @query   period - 'day' | 'week' | 'month' | 'year' (default: 'week')
 * @access  Admin only
 */
router.get('/', getAdminDashboard);

/**
 * @route   GET /admin/dashboard/top-franchises
 * @desc    Get top performing franchises by revenue
 * @query   limit - number of franchises to return (default: 5)
 * @access  Admin only
 */
router.get('/top-franchises', getTopFranchises);

/**
 * @route   GET /admin/dashboard/wallet-statistics
 * @desc    Get wallet statistics across all franchises
 * @access  Admin only
 */
router.get('/wallet-statistics', getWalletStatistics);

/**
 * @route   GET /admin/dashboard/orders-statistics
 * @desc    Get orders statistics - total count and per day breakdown
 * @access  Admin only
 */
router.get('/orders-statistics', getOrdersStatistics);

export default router;
