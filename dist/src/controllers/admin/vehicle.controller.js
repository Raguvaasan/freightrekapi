"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicleStatus = exports.updateVehicle = exports.getVehicleById = exports.getAllVehicles = exports.createVehicle = void 0;
const vehicle_service_1 = require("../../services/admin/vehicle.service");
const createVehicle = async (req, res) => {
    try {
        const result = await vehicle_service_1.vehicleService.createVehicle(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.createVehicle = createVehicle;
const getAllVehicles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const result = await vehicle_service_1.vehicleService.getAllVehicles(page, limit, search, status);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAllVehicles = getAllVehicles;
const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await vehicle_service_1.vehicleService.getVehicleById(String(id));
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getVehicleById = getVehicleById;
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await vehicle_service_1.vehicleService.updateVehicle(id, req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateVehicle = updateVehicle;
const updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await vehicle_service_1.vehicleService.updateVehicleStatus(id, status);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateVehicleStatus = updateVehicleStatus;
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await vehicle_service_1.vehicleService.deleteVehicle(id);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.deleteVehicle = deleteVehicle;
