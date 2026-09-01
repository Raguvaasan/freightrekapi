"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoute = exports.updateRouteBranches = exports.updateRouteStatus = exports.updateRoute = exports.getRouteById = exports.getAllRoutes = exports.createRoute = void 0;
const route_service_1 = require("../../services/admin/route.service");
const createRoute = async (req, res) => {
    try {
        const result = await route_service_1.routeService.createRoute(req.body);
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
exports.createRoute = createRoute;
const getAllRoutes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const result = await route_service_1.routeService.getAllRoutes(page, limit, search, status);
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
exports.getAllRoutes = getAllRoutes;
const getRouteById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await route_service_1.routeService.getRouteById(String(id));
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
exports.getRouteById = getRouteById;
const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await route_service_1.routeService.updateRoute(id, req.body);
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
exports.updateRoute = updateRoute;
const updateRouteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await route_service_1.routeService.updateRouteStatus(id, status);
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
exports.updateRouteStatus = updateRouteStatus;
const updateRouteBranches = async (req, res) => {
    try {
        const { id } = req.params;
        const { branches } = req.body;
        const result = await route_service_1.routeService.updateBranches(id, branches);
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
exports.updateRouteBranches = updateRouteBranches;
const deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await route_service_1.routeService.deleteRoute(id);
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
exports.deleteRoute = deleteRoute;
