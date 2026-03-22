"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffService = exports.StaffService = void 0;
const staff_model_1 = require("../../models/admin/staff.model");
const role_model_1 = require("../../models/admin/role.model");
const franchiseRole_model_1 = require("../../models/admin/franchiseRole.model");
const agency_model_1 = require("../../models/admin/agency.model");
const hub_model_1 = require("../../models/hub/hub.model");
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
class StaffService {
    // Staff Login (Generic - for backward compatibility)
    async loginStaff(username, password) {
        try {
            // Find staff by username
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password')
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
            // Manually populate roleId - check both AdminRole and FranchiseRole
            if (staff.roleId) {
                let roleData = await role_model_1.Role.findById(staff.roleId).select('name permissions').lean();
                if (!roleData) {
                    roleData = await franchiseRole_model_1.FranchiseRole.findById(staff.roleId).select('roleName permissions').lean();
                    if (roleData) {
                        // Map roleName to name for consistency
                        roleData = { ...roleData, name: roleData.roleName };
                    }
                }
                if (roleData) {
                    staff.roleId = roleData;
                }
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
    // Franchise Staff Login (Specific)
    async loginFranchiseStaff(username, password) {
        try {
            // Find staff by username
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password')
                .populate('franchiseId', 'agencyName');
            if (!staff) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }
            // Check if staff type is franchise
            if (staff.type !== 'franchise') {
                return {
                    success: false,
                    message: 'Invalid credentials. This is not a franchise staff account.',
                };
            }
            // Verify franchiseId exists
            if (!staff.franchiseId) {
                return {
                    success: false,
                    message: 'Franchise information missing. Contact administrator.',
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
                message: 'Franchise staff login successful',
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
    // Head Quarter Staff Login (Specific)
    async loginHeadQuarterStaff(username, password) {
        try {
            // Find staff by username
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password');
            if (!staff) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }
            // Check if staff type is head_quarter
            if (staff.type !== 'head_quarter') {
                return {
                    success: false,
                    message: 'Invalid credentials. This is not a head quarter staff account.',
                };
            }
            // Verify roleId exists
            if (!staff.roleId) {
                return {
                    success: false,
                    message: 'Role information missing. Contact administrator.',
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
            // Populate roleId from AdminRole
            let roleData = await role_model_1.Role.findById(staff.roleId).select('name permissions').lean();
            if (roleData) {
                staff.roleId = roleData;
            }
            // Remove password from response
            const staffData = staff.toObject();
            delete staffData.password;
            return {
                success: true,
                message: 'Head quarter staff login successful',
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
    // Hub Staff Login (Specific)
    async loginHubStaff(username, password) {
        try {
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password')
                .populate('hubId', 'hubName city');
            if (!staff) {
                return { success: false, message: 'Invalid credentials' };
            }
            if (staff.type !== 'hub') {
                return { success: false, message: 'Invalid credentials. This is not a hub staff account.' };
            }
            if (!staff.hubId) {
                return { success: false, message: 'Hub information missing. Contact administrator.' };
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, staff.password);
            if (!isPasswordValid) {
                return { success: false, message: 'Invalid credentials' };
            }
            if (staff.status !== 'Active') {
                return { success: false, message: 'Staff account is inactive' };
            }
            const staffData = staff.toObject();
            delete staffData.password;
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return { success: true, message: 'Hub staff login successful', data: { ...staffData, token } };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error during login' };
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
                // Head quarter staff must not have franchiseId
                if (data.franchiseId) {
                    return {
                        success: false,
                        message: 'Franchise should not be provided for head quarter staff',
                    };
                }
                // Validate roleId if provided
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await franchiseRole_model_1.FranchiseRole.findById(data.roleId);
                    if (!roleExists) {
                        return {
                            success: false,
                            message: 'Role not found',
                        };
                    }
                }
            }
            else if (data.type === 'franchise') {
                // Franchise staff must have franchiseId
                if (!data.franchiseId) {
                    return {
                        success: false,
                        message: 'Franchise is required for franchise staff',
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
                // Validate roleId if provided (check both AdminRole and FranchiseRole)
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await franchiseRole_model_1.FranchiseRole.findById(data.roleId);
                    if (!roleExists) {
                        return {
                            success: false,
                            message: 'Role not found',
                        };
                    }
                }
            }
            else if (data.type === 'hub') {
                // Hub staff must have hubId
                if (!data.hubId) {
                    return { success: false, message: 'Hub is required for hub staff' };
                }
                const hubExists = await hub_model_1.HubModel.findById(data.hubId);
                if (!hubExists) {
                    return { success: false, message: 'Hub not found' };
                }
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await franchiseRole_model_1.FranchiseRole.findById(data.roleId);
                    if (!roleExists) {
                        return { success: false, message: 'Role not found' };
                    }
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
            // Fetch created staff and manually populate roleId from correct collection
            const populatedStaff = await staff_model_1.Staff.findById(staff._id)
                .populate('franchiseId', 'agencyName agencyOwner')
                .populate('hubId', 'hubName city');
            // Manually populate roleId - check both AdminRole and FranchiseRole
            if (populatedStaff && populatedStaff.roleId) {
                let roleData = await role_model_1.Role.findById(populatedStaff.roleId).select('name permissions').lean();
                if (!roleData) {
                    roleData = await franchiseRole_model_1.FranchiseRole.findById(populatedStaff.roleId).select('roleName permissions').lean();
                    if (roleData) {
                        // Map roleName to name for consistency
                        roleData = { ...roleData, name: roleData.roleName };
                    }
                }
                if (roleData) {
                    populatedStaff.roleId = roleData;
                }
            }
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
                .populate('franchiseId', 'agencyName agencyOwner')
                .populate('hubId', 'hubName city');
            // Manually populate roleId for each staff - check both AdminRole and FranchiseRole
            for (const s of staff) {
                if (s.roleId) {
                    let roleData = await role_model_1.Role.findById(s.roleId).select('name permissions').lean();
                    if (!roleData) {
                        roleData = await franchiseRole_model_1.FranchiseRole.findById(s.roleId).select('roleName permissions').lean();
                        if (roleData) {
                            // Map roleName to name for consistency
                            roleData = { ...roleData, name: roleData.roleName };
                        }
                    }
                    if (roleData) {
                        s.roleId = roleData;
                    }
                }
            }
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
                .populate('franchiseId', 'agencyName agencyOwner')
                .populate('hubId', 'hubName city');
            if (!staff) {
                return {
                    success: false,
                    message: 'Staff not found',
                };
            }
            // Manually populate roleId - check both AdminRole and FranchiseRole
            if (staff.roleId) {
                let roleData = await role_model_1.Role.findById(staff.roleId).select('name permissions').lean();
                if (!roleData) {
                    roleData = await franchiseRole_model_1.FranchiseRole.findById(staff.roleId).select('roleName permissions').lean();
                    if (roleData) {
                        // Map roleName to name for consistency
                        roleData = { ...roleData, name: roleData.roleName };
                    }
                }
                if (roleData) {
                    staff.roleId = roleData;
                }
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
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await franchiseRole_model_1.FranchiseRole.findById(data.roleId);
                    if (!roleExists) {
                        return {
                            success: false,
                            message: 'Role not found',
                        };
                    }
                }
            }
            else if (staffType === 'franchise') {
                // If roleId is being updated, validate it exists
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await franchiseRole_model_1.FranchiseRole.findById(data.roleId);
                    if (!roleExists) {
                        return {
                            success: false,
                            message: 'Role not found',
                        };
                    }
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
            else if (staffType === 'hub') {
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await franchiseRole_model_1.FranchiseRole.findById(data.roleId);
                    if (!roleExists) {
                        return { success: false, message: 'Role not found' };
                    }
                }
                if (data.hubId) {
                    const hubExists = await hub_model_1.HubModel.findById(data.hubId);
                    if (!hubExists) {
                        return { success: false, message: 'Hub not found' };
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
            // Fetch updated staff and manually populate roleId from correct collection
            const updatedStaff = await staff_model_1.Staff.findById(id)
                .populate('franchiseId', 'agencyName agencyOwner')
                .populate('hubId', 'hubName city');
            // Manually populate roleId - check both AdminRole and FranchiseRole
            if (updatedStaff && updatedStaff.roleId) {
                let roleData = await role_model_1.Role.findById(updatedStaff.roleId).select('name permissions').lean();
                if (!roleData) {
                    roleData = await franchiseRole_model_1.FranchiseRole.findById(updatedStaff.roleId).select('roleName permissions').lean();
                    if (roleData) {
                        // Map roleName to name for consistency
                        roleData = { ...roleData, name: roleData.roleName };
                    }
                }
                if (roleData) {
                    updatedStaff.roleId = roleData;
                }
            }
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
                .populate('franchiseId', 'agencyName agencyOwner')
                .populate('hubId', 'hubName city');
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
