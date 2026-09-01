"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleService = exports.VehicleService = void 0;
const vehicle_model_1 = require("../../models/admin/vehicle.model");
const mongoose_1 = require("mongoose");
class VehicleService {
    // Create new vehicle
    async createVehicle(data) {
        try {
            const regNo = data.vehicleRegistrationNumber.toUpperCase();
            const existingVehicle = await vehicle_model_1.Vehicle.findOne({
                vehicleRegistrationNumber: regNo,
            });
            if (existingVehicle) {
                return {
                    success: false,
                    message: 'A vehicle with this registration number already exists',
                };
            }
            const vehicle = new vehicle_model_1.Vehicle({
                vehicleType: data.vehicleType,
                capacity: data.capacity,
                vehicleRegistrationNumber: regNo,
                rcNumber: data.rcNumber,
                insuranceNumber: data.insuranceNumber,
                status: data.status || 'Active',
            });
            await vehicle.save();
            return {
                success: true,
                message: 'Vehicle created successfully',
                data: vehicle,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating vehicle',
            };
        }
    }
    // Get all vehicles with pagination and search
    async getAllVehicles(page = 1, limit = 10, search, status) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            if (search) {
                query.$or = [
                    { vehicleType: { $regex: search, $options: 'i' } },
                    { vehicleRegistrationNumber: { $regex: search, $options: 'i' } },
                    { rcNumber: { $regex: search, $options: 'i' } },
                    { insuranceNumber: { $regex: search, $options: 'i' } },
                ];
            }
            if (status) {
                query.status = status;
            }
            const vehicles = await vehicle_model_1.Vehicle.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await vehicle_model_1.Vehicle.countDocuments(query);
            return {
                success: true,
                data: {
                    vehicles,
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
                message: error.message || 'Error fetching vehicles',
            };
        }
    }
    // Get vehicle by ID
    async getVehicleById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid vehicle ID',
                };
            }
            const vehicle = await vehicle_model_1.Vehicle.findById(id);
            if (!vehicle) {
                return {
                    success: false,
                    message: 'Vehicle not found',
                };
            }
            return {
                success: true,
                data: vehicle,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching vehicle',
            };
        }
    }
    // Update vehicle
    async updateVehicle(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid vehicle ID',
                };
            }
            const vehicle = await vehicle_model_1.Vehicle.findById(id);
            if (!vehicle) {
                return {
                    success: false,
                    message: 'Vehicle not found',
                };
            }
            // Check for duplicate registration number if being changed
            if (data.vehicleRegistrationNumber) {
                const regNo = data.vehicleRegistrationNumber.toUpperCase();
                if (regNo !== vehicle.vehicleRegistrationNumber) {
                    const existingVehicle = await vehicle_model_1.Vehicle.findOne({
                        vehicleRegistrationNumber: regNo,
                        _id: { $ne: id },
                    });
                    if (existingVehicle) {
                        return {
                            success: false,
                            message: 'A vehicle with this registration number already exists',
                        };
                    }
                }
                data.vehicleRegistrationNumber = regNo;
            }
            Object.keys(data).forEach((key) => {
                if (data[key] !== undefined) {
                    vehicle[key] = data[key];
                }
            });
            await vehicle.save();
            return {
                success: true,
                message: 'Vehicle updated successfully',
                data: vehicle,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating vehicle',
            };
        }
    }
    // Update vehicle status
    async updateVehicleStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid vehicle ID',
                };
            }
            const vehicle = await vehicle_model_1.Vehicle.findByIdAndUpdate(id, { status }, { new: true });
            if (!vehicle) {
                return {
                    success: false,
                    message: 'Vehicle not found',
                };
            }
            return {
                success: true,
                message: 'Vehicle status updated successfully',
                data: vehicle,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating vehicle status',
            };
        }
    }
    // Delete vehicle
    async deleteVehicle(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid vehicle ID',
                };
            }
            const vehicle = await vehicle_model_1.Vehicle.findById(id);
            if (!vehicle) {
                return {
                    success: false,
                    message: 'Vehicle not found',
                };
            }
            await vehicle_model_1.Vehicle.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Vehicle deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting vehicle',
            };
        }
    }
}
exports.VehicleService = VehicleService;
exports.vehicleService = new VehicleService();
