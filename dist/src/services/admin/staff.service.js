"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffService = exports.StaffService = void 0;
const staff_model_1 = require("../../models/admin/staff.model");
const role_model_1 = require("../../models/admin/role.model");
const agency_model_1 = require("../../models/admin/agency.model");
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class StaffService {
    // Staff Login
    async loginStaff(username, password) {
        try {
            // Find staff by username
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password')
                .populate('roleId', 'name permissions')
                .populate('franchiseId', 'agencyName');
            if (!staff) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, staff.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }
            // Check if staff is active
            if (staff.status !== 'Active') {
                return {
                    success: false,
                    message: 'Staff account is inactive',
                };
            }
            // Remove password from response
            const staffData = staff.toObject();
            delete staffData.password;
            return {
                success: true,
                message: 'Login successful',
                data: staffData,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error during login',
            };
        }
    }
    // Create new staff
    async createStaff(data) {
        try {
            // Check if email already exists
            const existingEmail = await staff_model_1.Staff.findOne({ email: data.email });
            if (existingEmail) {
                return {
                    success: false,
                    message: 'Email already exists',
                };
            }
            // Check if username already exists
            const existingUsername = await staff_model_1.Staff.findOne({ username: data.username });
            if (existingUsername) {
                return {
                    success: false,
                    message: 'Username already exists',
                };
            }
            // Validate based on type
            if (data.type === 'head_quarter') {
                // Head quarter staff must have roleId and must not have franchiseId
                if (!data.roleId) {
                    return {
                        success: false,
                        message: 'Role is required for head quarter staff',
                    };
                }
                if (data.franchiseId) {
                    return {
                        success: false,
                        message: 'Franchise should not be provided for head quarter staff',
                    };
                }
                // Validate roleId exists
                const roleExists = await role_model_1.Role.findById(data.roleId);
                if (!roleExists) {
                    return {
                        success: false,
                        message: 'Role not found',
                    };
                }
            }
            else if (data.type === 'franchise') {
                // Franchise staff must have franchiseId and must not have roleId
                if (!data.franchiseId) {
                    return {
                        success: false,
                        message: 'Franchise is required for franchise staff',
                    };
                }
                if (data.roleId) {
                    return {
                        success: false,
                        message: 'Role should not be provided for franchise staff',
                    };
                }
                // Validate franchiseId exists
                const franchiseExists = await agency_model_1.Agency.findById(data.franchiseId);
                if (!franchiseExists) {
                    return {
                        success: false,
                        message: 'Franchise not found',
                    };
                }
            }
            // Hash password
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(data.password, salt);
            const staff = new staff_model_1.Staff({
                ...data,
                password: hashedPassword,
            });
            await staff.save();
            // Build populate query based on what fields exist
            let query = staff_model_1.Staff.findById(staff._id);
            if (data.roleId) {
                query = query.populate('roleId', 'name permissions');
            }
            if (data.franchiseId) {
                query = query.populate('franchiseId', 'agencyName agencyOwner');
            }
            const populatedStaff = await query;
            return {
                success: true,
                message: 'Staff created successfully',
                data: populatedStaff,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating staff',
            };
        }
    }
    // Get all staff with pagination and search
    async getAllStaff(page = 1, limit = 10, search, status, franchiseId, roleId) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            // Search filter
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                ];
            }
            // Status filter
            if (status) {
                query.status = status;
            }
            // Franchise filter
            if (franchiseId && mongoose_1.Types.ObjectId.isValid(franchiseId)) {
                query.franchiseId = franchiseId;
            }
            // Role filter
            if (roleId && mongoose_1.Types.ObjectId.isValid(roleId)) {
                query.roleId = roleId;
            }
            const staff = await staff_model_1.Staff.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate('roleId', 'name permissions')
                .populate('franchiseId', 'agencyName agencyOwner');
            const total = await staff_model_1.Staff.countDocuments(query);
            return {
                success: true,
                data: {
                    staff,
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
                message: error.message || 'Error fetching staff',
            };
        }
    }
    // Get staff by ID
    async getStaffById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid staff ID',
                };
            }
            const staff = await staff_model_1.Staff.findById(id)
                .populate('roleId', 'name permissions')
                .populate('franchiseId', 'agencyName agencyOwner');
            if (!staff) {
                return {
                    success: false,
                    message: 'Staff not found',
                };
            }
            return {
                success: true,
                data: staff,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching staff',
            };
        }
    }
    // Update staff
    async updateStaff(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid staff ID',
                };
            }
            const staff = await staff_model_1.Staff.findById(id);
            if (!staff) {
                return {
                    success: false,
                    message: 'Staff not found',
                };
            }
            // Check if updating email and if new email already exists
            if (data.email && data.email !== staff.email) {
                const existingEmail = await staff_model_1.Staff.findOne({
                    email: data.email,
                    _id: { $ne: id },
                });
                if (existingEmail) {
                    return {
                        success: false,
                        message: 'Email already exists',
                    };
                }
            }
            // Check if updating username and if new username already exists
            if (data.username && data.username !== staff.username) {
                const existingUsername = await staff_model_1.Staff.findOne({
                    username: data.username,
                    _id: { $ne: id },
                });
                if (existingUsername) {
                    return {
                        success: false,
                        message: 'Username already exists',
                    };
                }
            }
            // Determine the type (use updated type or existing type)
            const staffType = data.type || staff.type;
            // Validate based on type
            if (staffType === 'head_quarter') {
                // Head quarter staff must not have franchiseId
                if (data.franchiseId) {
                    return {
                        success: false,
                        message: 'Franchise should not be provided for head quarter staff',
                    };
                }
                // If roleId is being updated, validate it exists
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId);
                    if (!roleExists) {
                        return {
                            success: false,
                            message: 'Role not found',
                        };
                    }
                }
            }
            else if (staffType === 'franchise') {
                // Franchise staff must not have roleId
                if (data.roleId) {
                    return {
                        success: false,
                        message: 'Role should not be provided for franchise staff',
                    };
                }
                // If franchiseId is being updated, validate it exists
                if (data.franchiseId) {
                    const franchiseExists = await agency_model_1.Agency.findById(data.franchiseId);
                    if (!franchiseExists) {
                        return {
                            success: false,
                            message: 'Franchise not found',
                        };
                    }
                }
            }
            // Hash password if being updated
            let updateData = { ...data };
            if (data.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                updateData.password = await bcryptjs_1.default.hash(data.password, salt);
            }
            // Update fields
            Object.keys(updateData).forEach((key) => {
                if (updateData[key] !== undefined) {
                    staff[key] = updateData[key];
                }
            });
            await staff.save();
            // Build populate query based on what fields exist
            let query = staff_model_1.Staff.findById(id);
            if (staff.roleId) {
                query = query.populate('roleId', 'name permissions');
            }
            if (staff.franchiseId) {
                query = query.populate('franchiseId', 'agencyName agencyOwner');
            }
            const updatedStaff = await query;
            return {
                success: true,
                message: 'Staff updated successfully',
                data: updatedStaff,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating staff',
            };
        }
    }
    // Delete staff
    async deleteStaff(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid staff ID',
                };
            }
            const staff = await staff_model_1.Staff.findById(id);
            if (!staff) {
                return {
                    success: false,
                    message: 'Staff not found',
                };
            }
            await staff_model_1.Staff.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Staff deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting staff',
            };
        }
    }
    // Update staff status
    async updateStaffStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid staff ID',
                };
            }
            const staff = await staff_model_1.Staff.findById(id);
            if (!staff) {
                return {
                    success: false,
                    message: 'Staff not found',
                };
            }
            staff.status = status;
            await staff.save();
            const updatedStaff = await staff_model_1.Staff.findById(id)
                .populate('roleId', 'name permissions')
                .populate('franchiseId', 'agencyName agencyOwner');
            return {
                success: true,
                message: 'Staff status updated successfully',
                data: updatedStaff,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating staff status',
            };
        }
    }
}
exports.StaffService = StaffService;
exports.staffService = new StaffService();
