"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackCollectionAgencyOrder = exports.deleteCollectionAgencyOrder = exports.updateCollectionAgencyOrder = exports.getCollectionAgencyOrder = exports.getCollectionAgencyOrders = exports.createCollectionAgencyOrder = void 0;
const shipment_service_1 = require("../../services/shipment.service");
const staff_model_1 = require("../../models/admin/staff.model");
const collectionAgency_model_1 = require("../../models/admin/collectionAgency.model");
// Helper: resolve the collection agency id from the authenticated user
// (collection agency direct login OR collection agency staff login)
const getCollectionAgencyId = async (userId) => {
    // First check if it's a collection agency staff
    const staff = await staff_model_1.Staff.findById(userId).select('collectionAgencyId type');
    if (staff && staff.type === 'collection_agency' && staff.collectionAgencyId) {
        return staff.collectionAgencyId.toString();
    }
    // Then check if it's a collection agency directly
    const agency = await collectionAgency_model_1.CollectionAgency.findById(userId);
    if (agency) {
        return agency._id.toString();
    }
    return null;
};
// POST /admin/collection-agency/orders/create
const createCollectionAgencyOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const collectionAgencyId = await getCollectionAgencyId(staffId);
        if (!collectionAgencyId)
            return res.status(403).json({ success: false, message: 'Collection agency access required' });
        // Validate assignedStaffId belongs to the same collection agency
        if (req.body.assignedStaffId) {
            const assignedStaff = await staff_model_1.Staff.findById(req.body.assignedStaffId).select('collectionAgencyId type');
            if (!assignedStaff || assignedStaff.type !== 'collection_agency' || !assignedStaff.collectionAgencyId || assignedStaff.collectionAgencyId.toString() !== collectionAgencyId) {
                return res.status(400).json({ success: false, message: 'Assigned staff must belong to the same collection agency' });
            }
        }
        const result = await shipment_service_1.shipmentService.createShipment({ userId: collectionAgencyId, ...req.body, skipWalletCheck: true });
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message, data: result.data });
        }
        return res.status(201).json({ success: true, message: 'Order created successfully', data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.createCollectionAgencyOrder = createCollectionAgencyOrder;
// GET /admin/collection-agency/orders
const getCollectionAgencyOrders = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const collectionAgencyId = await getCollectionAgencyId(staffId);
        if (!collectionAgencyId)
            return res.status(403).json({ success: false, message: 'Collection agency access required' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const result = await shipment_service_1.shipmentService.getShipments(collectionAgencyId, page, limit, status, false);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getCollectionAgencyOrders = getCollectionAgencyOrders;
// GET /admin/collection-agency/orders/:orderId
const getCollectionAgencyOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const collectionAgencyId = await getCollectionAgencyId(staffId);
        if (!collectionAgencyId)
            return res.status(403).json({ success: false, message: 'Collection agency access required' });
        const { orderId } = req.params;
        const result = await shipment_service_1.shipmentService.getShipment(orderId, collectionAgencyId, false);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getCollectionAgencyOrder = getCollectionAgencyOrder;
// PUT /admin/collection-agency/orders/:orderId
const updateCollectionAgencyOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const collectionAgencyId = await getCollectionAgencyId(staffId);
        if (!collectionAgencyId)
            return res.status(403).json({ success: false, message: 'Collection agency access required' });
        const { orderId } = req.params;
        // Verify order belongs to this collection agency
        const existing = await shipment_service_1.shipmentService.getShipment(orderId, collectionAgencyId, false);
        if (!existing.success)
            return res.status(404).json(existing);
        const result = await shipment_service_1.shipmentService.updateShipment(orderId, collectionAgencyId, req.body);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.updateCollectionAgencyOrder = updateCollectionAgencyOrder;
// DELETE /admin/collection-agency/orders/:orderId
const deleteCollectionAgencyOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const collectionAgencyId = await getCollectionAgencyId(staffId);
        if (!collectionAgencyId)
            return res.status(403).json({ success: false, message: 'Collection agency access required' });
        const { orderId } = req.params;
        const result = await shipment_service_1.shipmentService.deleteShipment(orderId, collectionAgencyId);
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.deleteCollectionAgencyOrder = deleteCollectionAgencyOrder;
// GET /admin/collection-agency/orders/track/:waybill
const trackCollectionAgencyOrder = async (req, res) => {
    try {
        const staffId = req.user?.id;
        if (!staffId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const collectionAgencyId = await getCollectionAgencyId(staffId);
        if (!collectionAgencyId)
            return res.status(403).json({ success: false, message: 'Collection agency access required' });
        const { waybill } = req.params;
        const result = await shipment_service_1.shipmentService.trackShipment(waybill, collectionAgencyId, false);
        if (!result.success)
            return res.status(404).json(result);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.trackCollectionAgencyOrder = trackCollectionAgencyOrder;
