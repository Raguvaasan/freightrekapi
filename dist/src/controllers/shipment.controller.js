"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShipment = exports.updateShipment = exports.trackShipment = exports.getShipments = exports.getShipment = exports.createShipment = void 0;
const shipment_service_1 = require("../services/shipment.service");
const adminUser_model_1 = require("../models/admin/adminUser.model");
const agency_model_1 = require("../models/admin/agency.model");
const staff_model_1 = require("../models/admin/staff.model");
const hub_model_1 = require("../models/hub/hub.model");
const appCustomer_model_1 = require("../models/customer/appCustomer.model");
const createShipment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const result = await shipment_service_1.shipmentService.createShipment({
            userId,
            ...req.body,
            orderType: 'customer',
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
        // Check if user is admin
        let isAdmin = false;
        let hubId;
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
        }
        // Check if user is a hub or hub staff
        if (!isAdmin) {
            const staff = await staff_model_1.Staff.findById(userId).select('hubId type');
            if (staff && staff.type === 'hub' && staff.hubId) {
                hubId = staff.hubId.toString();
            }
            else {
                const hub = await hub_model_1.HubModel.findById(userId);
                if (hub) {
                    hubId = hub._id.toString();
                }
            }
        }
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
        // Check if user is admin
        let isAdmin = false;
        let franchiseUserIds = [];
        let hubId;
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
            // If admin, get all franchise (Agency), hub AND app customer user IDs
            if (isAdmin) {
                const agencies = await agency_model_1.Agency.find({}, '_id');
                const hubs = await hub_model_1.HubModel.find({}, '_id');
                const customers = await appCustomer_model_1.AppCustomer.find({}, '_id');
                franchiseUserIds = [
                    ...agencies.map(agency => agency._id.toString()),
                    ...hubs.map(hub => hub._id.toString()),
                    ...customers.map(c => c._id.toString()),
                ];
            }
        }
        // Check if user is hub staff
        if (!isAdmin) {
            const staff = await staff_model_1.Staff.findById(userId).select('hubId type');
            if (staff && staff.type === 'hub' && staff.hubId) {
                hubId = staff.hubId.toString();
            }
            else {
                // Check if user is hub directly
                const hub = await hub_model_1.HubModel.findById(userId);
                if (hub) {
                    hubId = hub._id.toString();
                }
            }
        }
        const result = await shipment_service_1.shipmentService.getShipments(userId, page, limit, status, isAdmin, franchiseUserIds, hubId);
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
        // Check if user is admin
        let isAdmin = false;
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
        }
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
        // Check if user is admin
        let isAdmin = false;
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
        }
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
        // Check if user is admin
        let isAdmin = false;
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
        }
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
