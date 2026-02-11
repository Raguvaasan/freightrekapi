"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const dashboard_controller_1 = require("../../controllers/admin/dashboard.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @route   GET /admin/dashboard
 * @desc    Get admin dashboard statistics (aggregated across all franchises)
 * @query   period - 'day' | 'week' | 'month' | 'year' (default: 'week')
 * @access  Admin only
 */
router.get('/', dashboard_controller_1.getAdminDashboard);
/**
 * @route   GET /admin/dashboard/top-franchises
 * @desc    Get top performing franchises by revenue
 * @query   limit - number of franchises to return (default: 5)
 * @access  Admin only
 */
router.get('/top-franchises', dashboard_controller_1.getTopFranchises);
/**
 * @route   GET /admin/dashboard/wallet-statistics
 * @desc    Get wallet statistics across all franchises
 * @access  Admin only
 */
router.get('/wallet-statistics', dashboard_controller_1.getWalletStatistics);
exports.default = router;
