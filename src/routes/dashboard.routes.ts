import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getFranchiseDashboard, getOrdersReport } from '../controllers/dashboard.controller';

const router = Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get franchise dashboard data
 * @access  Private (Franchise only)
 */
router.get('/', authMiddleware, getFranchiseDashboard);

/**
 * @route   GET /api/dashboard/orders-report
 * @desc    Get orders report with analytics and status breakdown.
 *          Date range is determined by the `period` parameter; case-insensitive.
 *          `dailyTrend` values are generated for every day inside the selected range.
 *          Admins (role=admin) receive unfiltered results across all franchises;
 *          other users see only shipments tied to their `userId`.
 * @access  Private (Franchise only – or admin for aggregated view)
 * @query   period - 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'customRange' (case-insensitive)
 * @query   startDate - ISO date string (required for customRange)
 * @query   endDate - ISO date string (required for customRange)
 */
router.get('/orders-report', authMiddleware, getOrdersReport);

export default router;
