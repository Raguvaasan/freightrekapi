"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersReport = exports.getFranchiseDashboard = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
/**
 * Get franchise dashboard data
 */
const getFranchiseDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const result = await dashboard_service_1.dashboardService.getFranchiseDashboard(userId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch dashboard data',
        });
    }
};
exports.getFranchiseDashboard = getFranchiseDashboard;
/**
 * Get orders report (analytics)
 */
const getOrdersReport = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role; // may be undefined
        const { period, startDate, endDate } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const result = await dashboard_service_1.dashboardService.getOrdersReport(userId, period, startDate, endDate, userRole);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch orders report',
        });
    }
};
exports.getOrdersReport = getOrdersReport;
