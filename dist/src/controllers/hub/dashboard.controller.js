"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHubDashboard = void 0;
const dashboard_service_1 = require("../../services/hub/dashboard.service");
const staff_model_1 = require("../../models/admin/staff.model");
const hub_model_1 = require("../../models/hub/hub.model");
// Helper: get hubId from authenticated user (hub direct or hub staff)
const getHubId = async (userId) => {
    const staff = await staff_model_1.Staff.findById(userId).select('hubId type');
    if (staff && staff.type === 'hub' && staff.hubId) {
        return staff.hubId.toString();
    }
    const hub = await hub_model_1.HubModel.findById(userId);
    if (hub) {
        return hub._id.toString();
    }
    return null;
};
// GET /hub/dashboard
const getHubDashboard = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const hubId = await getHubId(staffId);
        if (!hubId)
            return res.status(403).json({ success: false, message: 'Hub staff access required' });
        const period = req.query.period || 'thisMonth';
        const validPeriods = ['week', 'thisMonth', 'lastMonth', 'month'];
        const selectedPeriod = validPeriods.includes(period) ? period : 'thisMonth';
        const result = await dashboard_service_1.hubDashboardService.getDashboard(hubId, selectedPeriod);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getHubDashboard = getHubDashboard;
