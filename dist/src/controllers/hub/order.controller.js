"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackHubOrder = exports.deleteHubOrder = exports.updateHubOrder = exports.getHubOrder = exports.getHubOrders = exports.createHubOrder = void 0;
const shipment_service_1 = require("../../services/shipment.service");
const staff_model_1 = require("../../models/admin/staff.model");
const hub_model_1 = require("../../models/hub/hub.model");
// Helper: get hubId from authenticated user (hub direct or hub staff)
const getHubId = async (userId) => {
    // First check if it's a hub staff
    const staff = await staff_model_1.Staff.findById(userId).select('hubId type');
    if (staff && staff.type === 'hub' && staff.hubId) {
        return staff.hubId.toString();
    }
    // Then check if it's a hub directly
    const hub = await hub_model_1.HubModel.findById(userId);
    if (hub) {
        return hub._id.toString();
    }
    return null;
};
// POST /hub/orders/create
const createHubOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const hubId = await getHubId(staffId);
        if (!hubId)
            return res.status(403).json({ success: false, message: 'Hub staff access required' });
        // Validate orderType
        const orderType = req.body.orderType || 'customer';
        // If hub type, pickupLocation and from address fields are mandatory
        if (orderType === 'hub') {
            if (!req.body.pickupLocation || !req.body.pickupLocation.name) {
                return res.status(400).json({ success: false, message: 'pickupLocation is required for hub order type' });
            }
            if (!req.body.fromName || !req.body.fromAdd || !req.body.fromPin || !req.body.fromCity || !req.body.fromState || !req.body.fromPhone) {
                return res.status(400).json({ success: false, message: 'From address fields (fromName, fromAdd, fromPin, fromCity, fromState, fromPhone) are required for hub order type' });
            }
        }
        // Validate assignedStaffId belongs to the same hub
        if (req.body.assignedStaffId) {
            const assignedStaff = await staff_model_1.Staff.findById(req.body.assignedStaffId).select('hubId type');
            if (!assignedStaff || assignedStaff.type !== 'hub' || !assignedStaff.hubId || assignedStaff.hubId.toString() !== hubId) {
                return res.status(400).json({ success: false, message: 'Assigned staff must belong to the same hub' });
            }
        }
        const result = await shipment_service_1.shipmentService.createShipment({ userId: hubId, ...req.body, orderType, skipWalletCheck: true });
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(201).json({ success: true, message: 'Order created successfully', data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.createHubOrder = createHubOrder;
// GET /hub/orders
const getHubOrders = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const hubId = await getHubId(staffId);
        if (!hubId)
            return res.status(403).json({ success: false, message: 'Hub staff access required' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const result = await shipment_service_1.shipmentService.getShipments(hubId, page, limit, status, false, undefined, hubId);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getHubOrders = getHubOrders;
// GET /hub/orders/:orderId
const getHubOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const hubId = await getHubId(staffId);
        if (!hubId)
            return res.status(403).json({ success: false, message: 'Hub staff access required' });
        const { orderId } = req.params;
        const result = await shipment_service_1.shipmentService.getShipment(orderId, hubId, false);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getHubOrder = getHubOrder;
// PUT /hub/orders/:orderId
const updateHubOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const hubId = await getHubId(staffId);
        if (!hubId)
            return res.status(403).json({ success: false, message: 'Hub staff access required' });
        const { orderId } = req.params;
        // Verify order belongs to this hub
        const existing = await shipment_service_1.shipmentService.getShipment(orderId, hubId, false);
        if (!existing.success)
            return res.status(404).json(existing);
        const result = await shipment_service_1.shipmentService.updateShipment(orderId, hubId, req.body);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.updateHubOrder = updateHubOrder;
// DELETE /hub/orders/:orderId
const deleteHubOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const hubId = await getHubId(staffId);
        if (!hubId)
            return res.status(403).json({ success: false, message: 'Hub staff access required' });
        const { orderId } = req.params;
        const result = await shipment_service_1.shipmentService.deleteShipment(orderId, hubId);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.deleteHubOrder = deleteHubOrder;
// GET /hub/orders/track/:waybill
const trackHubOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { waybill } = req.params;
        const result = await shipment_service_1.shipmentService.trackShipment(waybill, staffId, false);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.trackHubOrder = trackHubOrder;
