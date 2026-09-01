"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverService = exports.DriverService = void 0;
const driver_model_1 = require("../../models/admin/driver.model");
const mongoose_1 = require("mongoose");
class DriverService {
    // Create new driver
    async createDriver(data) {
        try {
            const licenseNo = data.licenseNumber.toUpperCase();
            const existingDriver = await driver_model_1.Driver.findOne({
                licenseNumber: licenseNo,
            });
            if (existingDriver) {
                return {
                    success: false,
                    message: 'A driver with this license number already exists',
                };
            }
            const driver = new driver_model_1.Driver({
                driverName: data.driverName,
                phoneNumber: data.phoneNumber,
                licenseNumber: licenseNo,
                dateOfExpiry: data.dateOfExpiry,
                status: data.status || 'Active',
            });
            await driver.save();
            return {
                success: true,
                message: 'Driver created successfully',
                data: driver,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating driver',
            };
        }
    }
    // Get all drivers with pagination and search
    async getAllDrivers(page = 1, limit = 10, search, status) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            if (search) {
                query.$or = [
                    { driverName: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                    { licenseNumber: { $regex: search, $options: 'i' } },
                ];
            }
            if (status) {
                query.status = status;
            }
            const drivers = await driver_model_1.Driver.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await driver_model_1.Driver.countDocuments(query);
            return {
                success: true,
                data: {
                    drivers,
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
                message: error.message || 'Error fetching drivers',
            };
        }
    }
    // Get driver by ID
    async getDriverById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid driver ID',
                };
            }
            const driver = await driver_model_1.Driver.findById(id);
            if (!driver) {
                return {
                    success: false,
                    message: 'Driver not found',
                };
            }
            return {
                success: true,
                data: driver,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching driver',
            };
        }
    }
    // Update driver
    async updateDriver(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid driver ID',
                };
            }
            const driver = await driver_model_1.Driver.findById(id);
            if (!driver) {
                return {
                    success: false,
                    message: 'Driver not found',
                };
            }
            // Check for duplicate license number if being changed
            if (data.licenseNumber) {
                const licenseNo = data.licenseNumber.toUpperCase();
                if (licenseNo !== driver.licenseNumber) {
                    const existingDriver = await driver_model_1.Driver.findOne({
                        licenseNumber: licenseNo,
                        _id: { $ne: id },
                    });
                    if (existingDriver) {
                        return {
                            success: false,
                            message: 'A driver with this license number already exists',
                        };
                    }
                }
                data.licenseNumber = licenseNo;
            }
            Object.keys(data).forEach((key) => {
                if (data[key] !== undefined) {
                    driver[key] = data[key];
                }
            });
            await driver.save();
            return {
                success: true,
                message: 'Driver updated successfully',
                data: driver,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating driver',
            };
        }
    }
    // Update driver status
    async updateDriverStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid driver ID',
                };
            }
            const driver = await driver_model_1.Driver.findByIdAndUpdate(id, { status }, { new: true });
            if (!driver) {
                return {
                    success: false,
                    message: 'Driver not found',
                };
            }
            return {
                success: true,
                message: 'Driver status updated successfully',
                data: driver,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating driver status',
            };
        }
    }
    // Delete driver
    async deleteDriver(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid driver ID',
                };
            }
            const driver = await driver_model_1.Driver.findById(id);
            if (!driver) {
                return {
                    success: false,
                    message: 'Driver not found',
                };
            }
            await driver_model_1.Driver.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Driver deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting driver',
            };
        }
    }
}
exports.DriverService = DriverService;
exports.driverService = new DriverService();
