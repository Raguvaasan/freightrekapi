"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffService = exports.StaffService = void 0;
const staff_model_1 = require("../../models/admin/staff.model");
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
            // Hash password
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(data.password, salt);
            const staff = new staff_model_1.Staff({
                ...data,
                password: hashedPassword,
            });
            await staff.save();
            const populatedStaff = await staff_model_1.Staff.findById(staff._id)
                .populate('roleId', 'name permissions')
                .populate('franchiseId', 'agencyName agencyOwner');
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
            const updatedStaff = await staff_model_1.Staff.findById(id)
                .populate('roleId', 'name permissions')
                .populate('franchiseId', 'agencyName agencyOwner');
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
