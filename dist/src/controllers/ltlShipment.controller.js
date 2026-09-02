"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLtlShipment = exports.updateLtlShipment = exports.getLtlShipments = exports.getLtlShipment = exports.createLtlShipment = void 0;
const ltlShipment_service_1 = require("../services/ltlShipment.service");
const adminUser_model_1 = require("../models/admin/adminUser.model");
const role_model_1 = require("../models/admin/role.model");
const staff_model_1 = require("../models/admin/staff.model");
const hub_model_1 = require("../models/hub/hub.model");
// Helper: Resolve user role
async function resolveUserAccess(userId) {
    const adminUser = await adminUser_model_1.AdminUser.findById(userId);
    if (adminUser) {
        return { isAdmin: true };
    }
    const staff = await staff_model_1.Staff.findById(userId).select('roleId hubId type');
    if (staff) {
        if (staff.roleId) {
            const role = await role_model_1.Role.findById(staff.roleId).select('isRoot').lean();
            if (role && role.isRoot === true)
                return { isAdmin: true };
        }
        if (staff.type === 'hub' && staff.hubId) {
            return { isAdmin: false, hubId: staff.hubId.toString() };
        }
        return { isAdmin: false };
    }
    const hub = await hub_model_1.HubModel.findById(userId);
    if (hub) {
        return { isAdmin: false, hubId: hub._id.toString() };
    }
    return { isAdmin: false };
}
const createLtlShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const result = await ltlShipment_service_1.ltlShipmentService.createShipment({
            userId,
            ...req.body,
            orderType: req.body.orderType || 'b2b',
        });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(201).json({
            success: true,
            message: 'LTL Shipment created successfully',
            data: result.data,
        });
    }
    catch (err) {
        console.error('Create LTL shipment error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to create LTL shipment',
        });
    }
};
exports.createLtlShipment = createLtlShipment;
const getLtlShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orderId = req.params.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        const result = await ltlShipment_service_1.ltlShipmentService.getShipment(orderId, userId, isAdmin, hubId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch LTL shipment',
        });
    }
};
exports.getLtlShipment = getLtlShipment;
const getLtlShipments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        const result = await ltlShipment_service_1.ltlShipmentService.getShipments(userId, page, limit, status, isAdmin, hubId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch LTL shipments',
        });
    }
};
exports.getLtlShipments = getLtlShipments;
const updateLtlShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orderId = req.params.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        const result = await ltlShipment_service_1.ltlShipmentService.updateShipment(orderId, userId, req.body, isAdmin, hubId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        return res.status(200).json({
            success: true,
            message: 'LTL Shipment updated successfully',
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to update LTL shipment',
        });
    }
};
exports.updateLtlShipment = updateLtlShipment;
const deleteLtlShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orderId = req.params.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        const result = await ltlShipment_service_1.ltlShipmentService.deleteShipment(orderId, userId, isAdmin, hubId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to delete LTL shipment',
        });
    }
};
exports.deleteLtlShipment = deleteLtlShipment;
