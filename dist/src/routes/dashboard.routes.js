"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/dashboard
 * @desc    Get franchise dashboard data
 * @access  Private (Franchise only)
 */
router.get('/', auth_middleware_1.authMiddleware, dashboard_controller_1.getFranchiseDashboard);
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
router.get('/orders-report', auth_middleware_1.authMiddleware, dashboard_controller_1.getOrdersReport);
exports.default = router;
