"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const dashboard_controller_1 = require("../../controllers/admin/dashboard.controller");
const router = (0, express_1.Router)();
// all admin report routes require authentication and the "reports" module read permission
router.use(auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)('reports', 'read'));
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
router.get('/total-revenue', dashboard_controller_1.getTotalRevenueReport);
/**
 * @route   GET /admin/reports/delivery-performance
 * @desc    Get delivery performance metrics for admin reports
 *          (on‑time %, avg time, zone break‑downs, attempt stats, etc.)
 * @query   period - same values as other reports (today, thisWeek, thisMonth, lastMonth, thisQuarter, thisYear, customRange)
 * @query   startDate - ISO date string (required for customRange)
 * @query   endDate - ISO date string (required for customRange)
 * @access  Admin only (reports permission)
 */
router.get('/delivery-performance', dashboard_controller_1.getDeliveryPerformanceReport);
exports.default = router;
