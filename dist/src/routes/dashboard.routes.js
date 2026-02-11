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
exports.default = router;
