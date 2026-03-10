import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { getTotalRevenueReport, getDeliveryPerformanceReport } from '../../controllers/admin/dashboard.controller';

const router = Router();

// all admin report routes require authentication and the "reports" module read permission
router.use(authMiddleware, checkPermission('reports','read'));

/**
 * @route   GET /admin/reports/total-revenue
 * @desc    Get aggregated revenue data for admin reports page
 *          Accepts period values similar to frontend dropdown.
 *          Supports `customRange` with startDate/endDate query params.
 * @query   period - 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'customRange'
 * @query   startDate - ISO date (required for customRange)
 * @query   endDate - ISO date (required for customRange)
 * @access  Admin only (with reports permission)
 */
router.get('/total-revenue', getTotalRevenueReport);

/**
 * @route   GET /admin/reports/delivery-performance
 * @desc    Get delivery performance metrics for admin reports
 *          (on‑time %, avg time, zone break‑downs, attempt stats, etc.)
 * @query   period - same values as other reports (today, thisWeek, thisMonth, lastMonth, thisQuarter, thisYear, customRange)
 * @query   startDate - ISO date string (required for customRange)
 * @query   endDate - ISO date string (required for customRange)
 * @access  Admin only (reports permission)
 */
router.get('/delivery-performance', getDeliveryPerformanceReport);

export default router;