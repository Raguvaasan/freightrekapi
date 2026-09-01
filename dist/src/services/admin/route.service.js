"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeService = exports.RouteService = void 0;
const route_model_1 = require("../../models/admin/route.model");
const mongoose_1 = require("mongoose");
class RouteService {
    // Create new route
    async createRoute(data) {
        try {
            // Check if a route with the same origin/destination already exists
            const existingRoute = await route_model_1.Route.findOne({
                from: data.from,
                to: data.to,
            });
            if (existingRoute) {
                return {
                    success: false,
                    message: 'A route with this origin and destination already exists',
                };
            }
            const route = new route_model_1.Route({
                routeName: data.routeName,
                from: data.from,
                to: data.to,
                branches: data.branches || [],
                transportationCharge: data.transportationCharge ?? 0,
                status: data.status || 'Active',
            });
            await route.save();
            return {
                success: true,
                message: 'Route created successfully',
                data: route,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating route',
            };
        }
    }
    // Get all routes with pagination and search
    async getAllRoutes(page = 1, limit = 10, search, status) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            if (search) {
                query.$or = [
                    { routeName: { $regex: search, $options: 'i' } },
                    { from: { $regex: search, $options: 'i' } },
                    { to: { $regex: search, $options: 'i' } },
                    { branches: { $regex: search, $options: 'i' } },
                ];
            }
            if (status) {
                query.status = status;
            }
            const routes = await route_model_1.Route.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await route_model_1.Route.countDocuments(query);
            return {
                success: true,
                data: {
                    routes,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching routes',
            };
        }
    }
    // Get route by ID
    async getRouteById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid route ID',
                };
            }
            const route = await route_model_1.Route.findById(id);
            if (!route) {
                return {
                    success: false,
                    message: 'Route not found',
                };
            }
            return {
                success: true,
                data: route,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching route',
            };
        }
    }
    // Update route
    async updateRoute(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid route ID',
                };
            }
            const route = await route_model_1.Route.findById(id);
            if (!route) {
                return {
                    success: false,
                    message: 'Route not found',
                };
            }
            // Check for duplicate origin/destination if either is being changed
            const newFrom = data.from ?? route.from;
            const newTo = data.to ?? route.to;
            if (newFrom !== route.from || newTo !== route.to) {
                const existingRoute = await route_model_1.Route.findOne({
                    from: newFrom,
                    to: newTo,
                    _id: { $ne: id },
                });
                if (existingRoute) {
                    return {
                        success: false,
                        message: 'A route with this origin and destination already exists',
                    };
                }
            }
            Object.keys(data).forEach((key) => {
                if (data[key] !== undefined) {
                    route[key] = data[key];
                }
            });
            await route.save();
            return {
                success: true,
                message: 'Route updated successfully',
                data: route,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating route',
            };
        }
    }
    // Update route status
    async updateRouteStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid route ID',
                };
            }
            const route = await route_model_1.Route.findByIdAndUpdate(id, { status }, { new: true });
            if (!route) {
                return {
                    success: false,
                    message: 'Route not found',
                };
            }
            return {
                success: true,
                message: 'Route status updated successfully',
                data: route,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating route status',
            };
        }
    }
    // Update route branches (Branch Management - replaces the branch list)
    async updateBranches(id, branches) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid route ID',
                };
            }
            // Normalise: trim + remove empties + de-duplicate
            const cleaned = Array.from(new Set((branches || [])
                .map((b) => (b || '').trim())
                .filter((b) => b.length > 0)));
            const route = await route_model_1.Route.findByIdAndUpdate(id, { branches: cleaned }, { new: true });
            if (!route) {
                return {
                    success: false,
                    message: 'Route not found',
                };
            }
            return {
                success: true,
                message: 'Route branches updated successfully',
                data: route,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating route branches',
            };
        }
    }
    // Delete route
    async deleteRoute(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid route ID',
                };
            }
            const route = await route_model_1.Route.findById(id);
            if (!route) {
                return {
                    success: false,
                    message: 'Route not found',
                };
            }
            await route_model_1.Route.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Route deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting route',
            };
        }
    }
}
exports.RouteService = RouteService;
exports.routeService = new RouteService();
