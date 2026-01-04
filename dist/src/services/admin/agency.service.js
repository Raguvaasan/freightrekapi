"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agencyService = exports.AgencyService = void 0;
const agency_model_1 = require("../../models/admin/agency.model");
const mongoose_1 = require("mongoose");
class AgencyService {
    // Create new agency
    async createAgency(data) {
        try {
            // Check if agency with same name already exists
            const existingAgency = await agency_model_1.Agency.findOne({
                agencyName: data.agencyName
            });
            if (existingAgency) {
                return {
                    success: false,
                    message: 'Agency with this name already exists',
                };
            }
            const agency = new agency_model_1.Agency({
                ...data,
            });
            await agency.save();
            const populatedAgency = await agency_model_1.Agency.findById(agency._id);
            return {
                success: true,
                message: 'Agency created successfully',
                data: populatedAgency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating agency',
            };
        }
    }
    // Get all agencies with pagination and search
    async getAllAgencies(page = 1, limit = 10, search, status) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            // Search filter
            if (search) {
                query.$or = [
                    { agencyName: { $regex: search, $options: 'i' } },
                    { agencyOwner: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ];
            }
            // Status filter
            if (status) {
                query.status = status;
            }
            const agencies = await agency_model_1.Agency.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await agency_model_1.Agency.countDocuments(query);
            return {
                success: true,
                data: {
                    agencies,
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
                message: error.message || 'Error fetching agencies',
            };
        }
    }
    // Get agency by ID
    async getAgencyById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findById(id);
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            return {
                success: true,
                data: agency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching agency',
            };
        }
    }
    // Update agency
    async updateAgency(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findById(id);
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            // Check if updating name and if new name already exists
            if (data.agencyName && data.agencyName !== agency.agencyName) {
                const existingAgency = await agency_model_1.Agency.findOne({
                    agencyName: data.agencyName,
                    _id: { $ne: id },
                });
                if (existingAgency) {
                    return {
                        success: false,
                        message: 'Agency with this name already exists',
                    };
                }
            }
            // Update fields
            Object.keys(data).forEach((key) => {
                if (data[key] !== undefined) {
                    agency[key] = data[key];
                }
            });
            await agency.save();
            const updatedAgency = await agency_model_1.Agency.findById(id);
            return {
                success: true,
                message: 'Agency updated successfully',
                data: updatedAgency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating agency',
            };
        }
    }
    // Delete agency
    async deleteAgency(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findById(id);
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            await agency_model_1.Agency.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Agency deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting agency',
            };
        }
    }
    // Update agency status
    async updateAgencyStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findByIdAndUpdate(id, { status }, { new: true });
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            return {
                success: true,
                message: 'Agency status updated successfully',
                data: agency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating agency status',
            };
        }
    }
}
exports.AgencyService = AgencyService;
exports.agencyService = new AgencyService();
