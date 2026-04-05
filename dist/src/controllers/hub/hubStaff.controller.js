"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editOrder = exports.updateAccountSettings = exports.updateOrderStatus = exports.getBookingDetail = exports.getDeliveryHistory = exports.getMyTasks = exports.getProfile = void 0;
const hubStaff_service_1 = require("../../services/hub/hubStaff.service");
// GET /hub/staff/profile
const getProfile = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await hubStaff_service_1.hubStaffService.getProfile(staffId);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getProfile = getProfile;
// GET /hub/staff/my-tasks
const getMyTasks = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await hubStaff_service_1.hubStaffService.getMyTasks(staffId, page, limit);
        if (!result.success)
            return res.status(403).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getMyTasks = getMyTasks;
// GET /hub/staff/delivery-history
const getDeliveryHistory = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await hubStaff_service_1.hubStaffService.getDeliveryHistory(staffId, page, limit);
        if (!result.success)
            return res.status(403).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getDeliveryHistory = getDeliveryHistory;
// GET /hub/staff/booking/:orderId
const getBookingDetail = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { orderId } = req.params;
        const result = await hubStaff_service_1.hubStaffService.getBookingDetail(staffId, orderId);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getBookingDetail = getBookingDetail;
// PATCH /hub/staff/booking/:orderId/status
const updateOrderStatus = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { orderId } = req.params;
        const { status } = req.body;
        if (!status)
            return res.status(400).json({ success: false, message: 'Status is required' });
        const result = await hubStaff_service_1.hubStaffService.updateOrderStatus(staffId, orderId, status);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// PUT /hub/staff/account-settings
const updateAccountSettings = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await hubStaff_service_1.hubStaffService.updateAccountSettings(staffId, req.body);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.updateAccountSettings = updateAccountSettings;
// PUT /hub/staff/booking/:orderId/edit
const editOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { orderId } = req.params;
        const result = await hubStaff_service_1.hubStaffService.editOrder(staffId, orderId, req.body);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.editOrder = editOrder;
