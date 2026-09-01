"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackFranchiseOrder = exports.deleteFranchiseOrder = exports.updateFranchiseOrder = exports.getFranchiseOrder = exports.getFranchiseOrders = exports.createFranchiseOrder = void 0;
const shipment_service_1 = require("../../services/shipment.service");
const staff_model_1 = require("../../models/admin/staff.model");
const agency_model_1 = require("../../models/admin/agency.model");
// Helper: resolve the franchise (agency) id from the authenticated user
// (franchise direct login OR franchise staff login)
const getFranchiseId = async (userId) => {
    // First check if it's a franchise staff
    const staff = await staff_model_1.Staff.findById(userId).select('franchiseId type');
    if (staff && staff.type === 'franchise' && staff.franchiseId) {
        return staff.franchiseId.toString();
    }
    // Then check if it's a franchise (agency) directly
    const agency = await agency_model_1.Agency.findById(userId);
    if (agency) {
        return agency._id.toString();
    }
    return null;
};
// POST /admin/franchise/orders/create
const createFranchiseOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const franchiseId = await getFranchiseId(staffId);
        if (!franchiseId)
            return res.status(403).json({ success: false, message: 'Franchise access required' });
        // Validate assignedStaffId belongs to the same franchise
        if (req.body.assignedStaffId) {
            const assignedStaff = await staff_model_1.Staff.findById(req.body.assignedStaffId).select('franchiseId type');
            if (!assignedStaff || assignedStaff.type !== 'franchise' || !assignedStaff.franchiseId || assignedStaff.franchiseId.toString() !== franchiseId) {
                return res.status(400).json({ success: false, message: 'Assigned staff must belong to the same franchise' });
            }
        }
        const result = await shipment_service_1.shipmentService.createShipment({ userId: franchiseId, ...req.body });
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message, data: result.data });
        }
        return res.status(201).json({ success: true, message: 'Order created successfully', data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.createFranchiseOrder = createFranchiseOrder;
// GET /admin/franchise/orders
const getFranchiseOrders = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const franchiseId = await getFranchiseId(staffId);
        if (!franchiseId)
            return res.status(403).json({ success: false, message: 'Franchise access required' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const result = await shipment_service_1.shipmentService.getShipments(franchiseId, page, limit, status, false);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getFranchiseOrders = getFranchiseOrders;
// GET /admin/franchise/orders/:orderId
const getFranchiseOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const franchiseId = await getFranchiseId(staffId);
        if (!franchiseId)
            return res.status(403).json({ success: false, message: 'Franchise access required' });
        const { orderId } = req.params;
        const result = await shipment_service_1.shipmentService.getShipment(orderId, franchiseId, false);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getFranchiseOrder = getFranchiseOrder;
// PUT /admin/franchise/orders/:orderId
const updateFranchiseOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const franchiseId = await getFranchiseId(staffId);
        if (!franchiseId)
            return res.status(403).json({ success: false, message: 'Franchise access required' });
        const { orderId } = req.params;
        // Verify order belongs to this franchise
        const existing = await shipment_service_1.shipmentService.getShipment(orderId, franchiseId, false);
        if (!existing.success)
            return res.status(404).json(existing);
        const result = await shipment_service_1.shipmentService.updateShipment(orderId, franchiseId, req.body);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.updateFranchiseOrder = updateFranchiseOrder;
// DELETE /admin/franchise/orders/:orderId
const deleteFranchiseOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const franchiseId = await getFranchiseId(staffId);
        if (!franchiseId)
            return res.status(403).json({ success: false, message: 'Franchise access required' });
        const { orderId } = req.params;
        const result = await shipment_service_1.shipmentService.deleteShipment(orderId, franchiseId);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.deleteFranchiseOrder = deleteFranchiseOrder;
// GET /admin/franchise/orders/track/:waybill
const trackFranchiseOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const franchiseId = await getFranchiseId(staffId);
        if (!franchiseId)
            return res.status(403).json({ success: false, message: 'Franchise access required' });
        const { waybill } = req.params;
        const result = await shipment_service_1.shipmentService.trackShipment(waybill, franchiseId, false);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.trackFranchiseOrder = trackFranchiseOrder;
