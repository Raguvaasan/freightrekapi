"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletStatistics = exports.getTopFranchises = exports.getAdminDashboard = void 0;
const dashboard_service_1 = require("../../services/admin/dashboard.service");
const dashboardService = new dashboard_service_1.AdminDashboardService();
const getAdminDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'week';
        const result = await dashboardService.getAdminDashboard(period);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Error fetching admin dashboard',
        });
    }
};
exports.getAdminDashboard = getAdminDashboard;
const getTopFranchises = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const result = await dashboardService.getTopFranchises(limit);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Error fetching top franchises',
        });
    }
};
exports.getTopFranchises = getTopFranchises;
const getWalletStatistics = async (req, res) => {
    try {
        const result = await dashboardService.getWalletStatistics();
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Error fetching wallet statistics',
        });
    }
};
exports.getWalletStatistics = getWalletStatistics;
