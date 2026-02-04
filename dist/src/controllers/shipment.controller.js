"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackShipment = exports.getShipments = exports.getShipment = exports.createShipment = void 0;
const shipment_service_1 = require("../services/shipment.service");
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
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to create shipment',
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
        const result = await shipment_service_1.shipmentService.getShipments(userId, page, limit, status);
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
