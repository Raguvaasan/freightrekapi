"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveShipments = exports.deleteShipment = exports.updateShipment = exports.trackShipment = exports.getShipments = exports.getShipment = exports.createShipment = void 0;
const shipment_service_1 = require("../services/shipment.service");
const adminUser_model_1 = require("../models/admin/adminUser.model");
const role_model_1 = require("../models/admin/role.model");
const staff_model_1 = require("../models/admin/staff.model");
const hub_model_1 = require("../models/hub/hub.model");
// Helper: Resolve user role - checks AdminUser first, then Staff with AdminRole
async function resolveUserAccess(userId) {
    // Check AdminUser collection — any admin user can manage all orders
    const adminUser = await adminUser_model_1.AdminUser.findById(userId);
    if (adminUser) {
        return { isAdmin: true };
    }
    // Check Staff collection
    const staff = await staff_model_1.Staff.findById(userId).select('roleId hubId type');
    if (staff) {
        // Check if staff has an admin role with isRoot
        if (staff.roleId) {
            const role = await role_model_1.Role.findById(staff.roleId).select('isRoot').lean();
            if (role && role.isRoot === true)
                return { isAdmin: true };
        }
        // Hub staff
        if (staff.type === 'hub' && staff.hubId) {
            return { isAdmin: false, hubId: staff.hubId.toString() };
        }
        // Head quarter staff without isRoot - treat as regular user
        return { isAdmin: false };
    }
    // Check if user is a Hub directly
    const hub = await hub_model_1.HubModel.findById(userId);
    if (hub) {
        return { isAdmin: false, hubId: hub._id.toString() };
    }
    return { isAdmin: false };
}
const createShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        // If the user is a franchise staff, use franchiseId for wallet deduction
        let walletUserId;
        const staff = await staff_model_1.Staff.findById(userId).select('type franchiseId');
        if (staff && staff.type === 'franchise' && staff.franchiseId) {
            walletUserId = staff.franchiseId.toString();
        }
        const result = await shipment_service_1.shipmentService.createShipment({
            userId,
            ...req.body,
            orderType: 'customer',
            walletUserId,
        });
        // Handle error responses (including insufficient wallet balance)
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                error: result.message, // Added for clarity
            });
        }
        // Success response
        return res.status(201).json({
            success: true,
            message: 'Shipment created successfully',
            data: result.data,
        });
    }
    catch (err) {
        console.error('Create shipment controller error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to create shipment',
            error: err.message,
        });
    }
};
exports.createShipment = createShipment;
const getShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        const result = await shipment_service_1.shipmentService.getShipment(orderId, userId, isAdmin, hubId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch shipment',
        });
    }
};
exports.getShipment = getShipment;
const getShipments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        const result = await shipment_service_1.shipmentService.getShipments(userId, page, limit, status, isAdmin, [], hubId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch shipments',
        });
    }
};
exports.getShipments = getShipments;
const trackShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { waybill } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        if (!waybill) {
            return res.status(400).json({
                success: false,
                message: 'Waybill is required',
            });
        }
        const { isAdmin } = await resolveUserAccess(userId);
        const result = await shipment_service_1.shipmentService.trackShipment(waybill, userId, isAdmin);
        if (!result.success) {
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to track shipment',
        });
    }
};
exports.trackShipment = trackShipment;
const updateShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;
        const updateData = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }
        const { isAdmin } = await resolveUserAccess(userId);
        const result = await shipment_service_1.shipmentService.updateShipment(orderId, userId, updateData, isAdmin);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to update shipment',
        });
    }
};
exports.updateShipment = updateShipment;
const deleteShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }
        const { isAdmin } = await resolveUserAccess(userId);
        const result = await shipment_service_1.shipmentService.deleteShipment(orderId, userId, isAdmin);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to delete shipment',
        });
    }
};
exports.deleteShipment = deleteShipment;
const getActiveShipments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { isAdmin, hubId } = await resolveUserAccess(userId);
        // Active = not cancelled, not delivered
        const result = await shipment_service_1.shipmentService.getShipments(userId, page, limit, 'Active', isAdmin, [], hubId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch active shipments',
        });
    }
};
exports.getActiveShipments = getActiveShipments;
