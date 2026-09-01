"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDriver = exports.updateDriverStatus = exports.updateDriver = exports.getDriverById = exports.getAllDrivers = exports.createDriver = void 0;
const driver_service_1 = require("../../services/admin/driver.service");
const createDriver = async (req, res) => {
    try {
        const result = await driver_service_1.driverService.createDriver(req.body);
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
exports.createDriver = createDriver;
const getAllDrivers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const result = await driver_service_1.driverService.getAllDrivers(page, limit, search, status);
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
exports.getAllDrivers = getAllDrivers;
const getDriverById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await driver_service_1.driverService.getDriverById(String(id));
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
exports.getDriverById = getDriverById;
const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await driver_service_1.driverService.updateDriver(id, req.body);
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
exports.updateDriver = updateDriver;
const updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await driver_service_1.driverService.updateDriverStatus(id, status);
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
exports.updateDriverStatus = updateDriverStatus;
const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await driver_service_1.driverService.deleteDriver(id);
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
exports.deleteDriver = deleteDriver;
