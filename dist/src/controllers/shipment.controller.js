"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShipment = exports.updateShipment = exports.trackShipment = exports.getShipments = exports.getShipment = exports.createShipment = void 0;
const shipment_service_1 = require("../services/shipment.service");
const adminUser_model_1 = require("../models/admin/adminUser.model");
const agency_model_1 = require("../models/admin/agency.model");
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
        const result = await shipment_service_1.shipmentService.getShipment(orderId, userId);
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
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
            // If admin, get all franchise (Agency) user IDs
            if (isAdmin) {
                const agencies = await agency_model_1.Agency.find({}, '_id');
                franchiseUserIds = agencies.map(agency => agency._id.toString());
            }
        }
        const result = await shipment_service_1.shipmentService.getShipments(userId, page, limit, status, isAdmin, franchiseUserIds);
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
        const result = await shipment_service_1.shipmentService.trackShipment(waybill, userId);
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
        const result = await shipment_service_1.shipmentService.updateShipment(orderId, userId, updateData);
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
        const result = await shipment_service_1.shipmentService.deleteShipment(orderId, userId);
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
