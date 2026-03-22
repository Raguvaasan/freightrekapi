"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackHubOrder = exports.deleteHubOrder = exports.updateHubOrder = exports.getHubOrder = exports.getHubOrders = exports.createHubOrder = void 0;
const shipment_service_1 = require("../../services/shipment.service");
const staff_model_1 = require("../../models/admin/staff.model");
// Helper: get hubId from the authenticated hub staff
const getHubId = async (staffId) => {
    const staff = await staff_model_1.Staff.findById(staffId).select('hubId type');
    if (!staff || staff.type !== 'hub' || !staff.hubId)
        return null;
    return staff.hubId.toString();
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
        const result = await shipment_service_1.shipmentService.createShipment({ userId: hubId, ...req.body });
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
