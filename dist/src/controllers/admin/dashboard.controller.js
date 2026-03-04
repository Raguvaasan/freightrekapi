"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFranchiseReport = exports.getOrdersStatistics = exports.getWalletStatistics = exports.getTopFranchises = exports.getAdminDashboard = void 0;
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
        const period = req.query.period || 'all';
        const result = await dashboardService.getTopFranchises(limit, period);
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
const getOrdersStatistics = async (req, res) => {
    try {
        const result = await dashboardService.getOrdersStatistics();
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
            message: err.message || 'Error fetching orders statistics',
        });
    }
};
exports.getOrdersStatistics = getOrdersStatistics;
const getFranchiseReport = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const isPreviousPeriod = req.query.type === 'previous' || req.query.isPrevious === 'true';
        const result = await dashboardService.getFranchiseReport(period, isPreviousPeriod);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Error fetching franchise report' });
    }
};
exports.getFranchiseReport = getFranchiseReport;
