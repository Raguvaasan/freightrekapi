"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffService = exports.StaffService = void 0;
const staff_model_1 = require("../../models/admin/staff.model");
const role_model_1 = require("../../models/admin/role.model");
const franchiseRole_model_1 = require("../../models/admin/franchiseRole.model");
const collectionAgencyRole_model_1 = require("../../models/admin/collectionAgencyRole.model");
const hubRole_model_1 = require("../../models/hub/hubRole.model");
const agency_model_1 = require("../../models/admin/agency.model");
const collectionAgency_model_1 = require("../../models/admin/collectionAgency.model");
const hub_model_1 = require("../../models/hub/hub.model");
const wallet_model_1 = require("../../models/wallet/wallet.model");
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
const otp_model_1 = require("../../models/customer/otp.model");
const axios_1 = __importDefault(require("axios"));
const phoneCheck_1 = require("../../utils/phoneCheck");
// Resolve roleId from AdminRole, FranchiseRole, or HubRole
async function resolveRole(roleId) {
    if (!roleId)
        return null;
    let roleData = await role_model_1.Role.findById(roleId).select('roleName permissions isRoot').lean();
    if (roleData)
        return { ...roleData, _type: 'AdminRole' };
    roleData = await franchiseRole_model_1.FranchiseRole.findById(roleId).select('roleName franchiseId permissions').lean();
    if (roleData)
        return { ...roleData, _type: 'FranchiseRole' };
    roleData = await collectionAgencyRole_model_1.CollectionAgencyRole.findById(roleId).select('roleName collectionAgencyId permissions').lean();
    if (roleData)
        return { ...roleData, _type: 'CollectionAgencyRole' };
    roleData = await hubRole_model_1.HubRole.findById(roleId).select('roleName hubId permissions').lean();
    if (roleData)
        return { ...roleData, _type: 'HubRole' };
    return null;
}
class StaffService {
    // Staff Login (Generic - for backward compatibility)
    async loginStaff(username, password) {
        try {
            // Find staff by username
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password')
                .populate('franchiseId');
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
            // Resolve role from AdminRole, FranchiseRole, or HubRole
            if (staff.roleId) {
                const roleData = await resolveRole(staff.roleId);
                if (roleData) {
                    staff.roleId = roleData;
                }
            }
            // Remove password from response
            const staffData = staff.toObject();
            delete staffData.password;
            // Fetch franchise wallet if franchise staff
            let walletData = undefined;
            if (staff.type === 'franchise' && staff.franchiseId) {
                const franchiseIdStr = staff.franchiseId._id
                    ? staff.franchiseId._id.toString()
                    : staff.franchiseId.toString();
                const wallet = await wallet_model_1.Wallet.findOne({ userId: franchiseIdStr });
                walletData = wallet
                    ? { balance: wallet.balance, currency: wallet.currency }
                    : { balance: 0, currency: 'INR' };
            }
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'Login successful',
                data: { ...staffData, token, ...(walletData ? { wallet: walletData } : {}) },
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
                .populate('franchiseId');
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
            // Populate role from FranchiseRole or AdminRole
            if (staff.roleId) {
                const roleData = await resolveRole(staff.roleId);
                if (roleData) {
                    staff.roleId = roleData;
                }
            }
            // Remove password from response
            const staffData = staff.toObject();
            delete staffData.password;
            // Fetch franchise wallet
            const franchiseIdStr = staff.franchiseId
                ? staff.franchiseId._id
                    ? staff.franchiseId._id.toString()
                    : staff.franchiseId.toString()
                : null;
            const wallet = franchiseIdStr
                ? await wallet_model_1.Wallet.findOne({ userId: franchiseIdStr })
                : null;
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'Franchise staff login successful',
                data: {
                    ...staffData,
                    token,
                    wallet: wallet
                        ? { balance: wallet.balance, currency: wallet.currency }
                        : { balance: 0, currency: 'INR' },
                },
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
            // Populate role
            let roleData = await resolveRole(staff.roleId);
            if (roleData) {
                staff.roleId = roleData;
            }
            // Remove password from response
            const staffData = staff.toObject();
            delete staffData.password;
            // Generate JWT token for HQ staff (same as admin/hub staff)
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'Head quarter staff login successful',
                data: { ...staffData, token },
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
                .populate('hubId', 'hubName city pincode');
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
            // Populate role from HubRole or AdminRole
            if (staff.roleId) {
                const roleData = await resolveRole(staff.roleId);
                if (roleData) {
                    staff.roleId = roleData;
                }
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
            // Check phone global uniqueness
            const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(data.phone);
            if (phoneError) {
                return { success: false, message: phoneError };
            }
            // Email is optional (users can be created phone-first), so only check it
            // when one was supplied — `findOne({ email: undefined })` would match the
            // users that have no email at all and wrongly report a duplicate.
            if (data.email) {
                const existingEmail = await staff_model_1.Staff.findOne({ email: data.email });
                if (existingEmail) {
                    return {
                        success: false,
                        message: 'Email already exists',
                    };
                }
            }
            // Check if username already exists (only if username provided)
            if (data.username) {
                const existingUsername = await staff_model_1.Staff.findOne({ username: data.username });
                if (existingUsername) {
                    return {
                        success: false,
                        message: 'Username already exists',
                    };
                }
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
            else if (data.type === 'collection_agency') {
                // Collection agency staff must have collectionAgencyId
                if (!data.collectionAgencyId) {
                    return { success: false, message: 'Collection agency is required for collection agency staff' };
                }
                const collectionAgencyExists = await collectionAgency_model_1.CollectionAgency.findById(data.collectionAgencyId);
                if (!collectionAgencyExists) {
                    return { success: false, message: 'Collection agency not found' };
                }
                if (data.roleId) {
                    const roleExists = await role_model_1.Role.findById(data.roleId) || await collectionAgencyRole_model_1.CollectionAgencyRole.findById(data.roleId);
                    if (!roleExists) {
                        return { success: false, message: 'Role not found' };
                    }
                }
            }
            // Hash password if provided
            const staffData = { ...data };
            if (data.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                staffData.password = await bcryptjs_1.default.hash(data.password, salt);
            }
            const staff = new staff_model_1.Staff(staffData);
            await staff.save();
            // Fetch created staff and manually populate roleId from correct collection
            const populatedStaff = await staff_model_1.Staff.findById(staff._id)
                .populate('franchiseId', 'agencyName agencyOwner')
                .populate('hubId', 'hubName city')
                .populate('collectionAgencyId', 'collectionAgencyName ownerName');
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
                if (!roleData) {
                    roleData = await collectionAgencyRole_model_1.CollectionAgencyRole.findById(populatedStaff.roleId).select('roleName permissions').lean();
                    if (roleData) {
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
    async getAllStaff(page = 1, limit = 10, search, status, franchiseId, roleId, type, collectionAgencyId) {
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
            // Type filter
            if (type) {
                query.type = type;
            }
            // Franchise filter
            if (franchiseId && mongoose_1.Types.ObjectId.isValid(franchiseId)) {
                query.franchiseId = franchiseId;
            }
            // Collection agency filter
            if (collectionAgencyId && mongoose_1.Types.ObjectId.isValid(collectionAgencyId)) {
                query.collectionAgencyId = collectionAgencyId;
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
                .populate('hubId', 'hubName city')
                .populate('collectionAgencyId', 'collectionAgencyName ownerName');
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
                    if (!roleData) {
                        roleData = await collectionAgencyRole_model_1.CollectionAgencyRole.findById(s.roleId).select('roleName permissions').lean();
                        if (roleData) {
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
                .populate('hubId', 'hubName city')
                .populate('collectionAgencyId', 'collectionAgencyName ownerName');
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
                if (!roleData) {
                    roleData = await collectionAgencyRole_model_1.CollectionAgencyRole.findById(staff.roleId).select('roleName permissions').lean();
                    if (roleData) {
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
            // Check phone global uniqueness if updating phone
            if (data.phone && data.phone !== staff.phone) {
                const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(data.phone, { model: 'Staff', id });
                if (phoneError) {
                    return { success: false, message: phoneError };
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
                .populate('hubId', 'hubName city')
                .populate('collectionAgencyId', 'collectionAgencyName ownerName');
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
                if (!roleData) {
                    roleData = await collectionAgencyRole_model_1.CollectionAgencyRole.findById(updatedStaff.roleId).select('roleName permissions').lean();
                    if (roleData) {
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
                .populate('hubId', 'hubName city')
                .populate('collectionAgencyId', 'collectionAgencyName ownerName');
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
    // Collection Executive Login - works for all staff types (head_quarter, franchise, hub)
    async loginCollectionExecutive(username, password) {
        try {
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password')
                .populate('franchiseId', 'agencyName')
                .populate('hubId', 'hubName city');
            if (!staff) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, staff.password);
            if (!isPasswordValid) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Check if staff is active
            if (staff.status !== 'Active') {
                return { success: false, message: 'Staff account is inactive' };
            }
            // Check if staff has a role assigned
            if (!staff.roleId) {
                return { success: false, message: 'No role assigned. Contact administrator.' };
            }
            // Resolve role from AdminRole, FranchiseRole, or HubRole
            const roleData = await resolveRole(staff.roleId);
            if (!roleData) {
                return { success: false, message: 'Role not found. Contact administrator.' };
            }
            // Verify role is "Collection Executive"
            if (roleData.roleName !== 'Collection Executive') {
                return { success: false, message: 'Access denied. Only Collection Executive staff can login here.' };
            }
            const staffData = staff.toObject();
            delete staffData.password;
            staffData.roleId = roleData;
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'Collection Executive login successful',
                data: { ...staffData, token },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error during login' };
        }
    }
    // B2B Staff Login - Only Relationship Manager role allowed
    async loginB2bStaff(username, password) {
        try {
            const staff = await staff_model_1.Staff.findOne({ username })
                .select('+password');
            if (!staff) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Check if staff type is b2b
            if (staff.type !== 'b2b') {
                return { success: false, message: 'Invalid credentials. This is not a B2B staff account.' };
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, staff.password);
            if (!isPasswordValid) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Check if staff is active
            if (staff.status !== 'Active') {
                return { success: false, message: 'Staff account is inactive' };
            }
            // Check if staff has a role assigned
            if (!staff.roleId) {
                return { success: false, message: 'No role assigned. Contact administrator.' };
            }
            // Resolve role
            const roleData = await resolveRole(staff.roleId);
            if (!roleData) {
                return { success: false, message: 'Role not found. Contact administrator.' };
            }
            // Verify role is "Relationship Manager"
            if (roleData.roleName !== 'Relationship Manager') {
                return { success: false, message: 'Access denied. Only Relationship Manager can login here.' };
            }
            const staffData = staff.toObject();
            delete staffData.password;
            staffData.roleId = roleData;
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'B2B staff login successful',
                data: { ...staffData, token },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error during login' };
        }
    }
    // B2B Staff Login - Send OTP (only for type b2b)
    async sendB2bOtp(phone, countryCode) {
        try {
            const staff = await staff_model_1.Staff.findOne({ phone, type: 'b2b', status: 'Active' }).lean();
            if (!staff) {
                return { success: false, message: 'No active B2B staff account found with this phone number' };
            }
            // Verify role is Relationship Manager
            if (!staff.roleId) {
                return { success: false, message: 'No role assigned. Contact administrator.' };
            }
            const roleData = await resolveRole(staff.roleId);
            if (!roleData || roleData.roleName !== 'Relationship Manager') {
                return { success: false, message: 'Access denied. Only Relationship Manager can login here.' };
            }
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await otp_model_1.Otp.deleteMany({ phone, userType: 'staff' });
            await otp_model_1.Otp.create({ phone, countryCode, otp, expiresAt, userType: 'staff' });
            const apiKey = process.env.PING4SMS_API_KEY;
            const sender = process.env.PING4SMS_SENDER;
            const templateId = process.env.PING4SMS_TEMPLATE_ID;
            const route = process.env.PING4SMS_ROUTE || '2';
            const fullPhone = `${countryCode.replace('+', '')}${phone}`;
            const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
            const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
            console.log('[Ping4SMS] B2B OTP URL:', url);
            const smsResponse = await axios_1.default.get(url, { timeout: 10000 });
            console.log('[Ping4SMS] B2B OTP Response:', JSON.stringify(smsResponse.data));
            const responseStr = typeof smsResponse.data === 'string' ? smsResponse.data : JSON.stringify(smsResponse.data);
            if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
                return { success: false, message: `SMS sending failed: ${responseStr}` };
            }
            return { success: true, message: 'OTP sent successfully' };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error sending OTP' };
        }
    }
    // B2B Staff Login - Verify OTP (only for type b2b + Relationship Manager)
    async verifyB2bOtp(phone, countryCode, otp) {
        try {
            const record = await otp_model_1.Otp.findOne({ phone, used: false, userType: 'staff' }).lean();
            if (!record) {
                return { success: false, message: 'OTP not found. Please request a new one' };
            }
            if (new Date() > record.expiresAt) {
                await otp_model_1.Otp.deleteOne({ _id: record._id });
                return { success: false, message: 'OTP has expired. Please request a new one' };
            }
            if (record.otp !== otp) {
                return { success: false, message: 'Invalid OTP' };
            }
            await otp_model_1.Otp.updateOne({ _id: record._id }, { used: true });
            const staff = await staff_model_1.Staff.findOne({ phone, type: 'b2b', status: 'Active' }).lean();
            if (!staff) {
                return { success: false, message: 'No active B2B staff account found with this phone number' };
            }
            // Resolve role and verify Relationship Manager
            let roleData = null;
            if (staff.roleId) {
                roleData = await resolveRole(staff.roleId);
            }
            if (!roleData || roleData.roleName !== 'Relationship Manager') {
                return { success: false, message: 'Access denied. Only Relationship Manager can login here.' };
            }
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'B2B login successful',
                data: {
                    id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    phone: staff.phone,
                    type: staff.type,
                    status: staff.status,
                    roleId: roleData,
                    token,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error verifying OTP' };
        }
    }
    // OTP Login - Send OTP
    async sendLoginOtp(phone, countryCode, type) {
        try {
            const query = { phone, status: 'Active' };
            if (type)
                query.type = type;
            const staff = await staff_model_1.Staff.findOne(query).lean();
            if (!staff) {
                return { success: false, message: 'No active staff account found with this phone number' };
            }
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await otp_model_1.Otp.deleteMany({ phone, userType: 'staff' });
            await otp_model_1.Otp.create({ phone, countryCode, otp, expiresAt, userType: 'staff' });
            const apiKey = process.env.PING4SMS_API_KEY;
            const sender = process.env.PING4SMS_SENDER;
            const templateId = process.env.PING4SMS_TEMPLATE_ID;
            const route = process.env.PING4SMS_ROUTE || '2';
            const fullPhone = `${countryCode.replace('+', '')}${phone}`;
            const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
            const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
            console.log('[Ping4SMS] Staff OTP URL:', url);
            const smsResponse = await axios_1.default.get(url, { timeout: 10000 });
            console.log('[Ping4SMS] Staff OTP Response:', JSON.stringify(smsResponse.data));
            const responseStr = typeof smsResponse.data === 'string' ? smsResponse.data : JSON.stringify(smsResponse.data);
            if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
                return { success: false, message: `SMS sending failed: ${responseStr}` };
            }
            return { success: true, message: 'OTP sent successfully' };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error sending OTP' };
        }
    }
    // OTP Login - Verify OTP
    async verifyLoginOtp(phone, countryCode, otp, type) {
        try {
            const record = await otp_model_1.Otp.findOne({ phone, used: false, userType: 'staff' }).lean();
            if (!record) {
                return { success: false, message: 'OTP not found. Please request a new one' };
            }
            if (new Date() > record.expiresAt) {
                await otp_model_1.Otp.deleteOne({ _id: record._id });
                return { success: false, message: 'OTP has expired. Please request a new one' };
            }
            if (record.otp !== otp) {
                return { success: false, message: 'Invalid OTP' };
            }
            await otp_model_1.Otp.updateOne({ _id: record._id }, { used: true });
            const query = { phone, status: 'Active' };
            if (type)
                query.type = type;
            const staff = await staff_model_1.Staff.findOne(query)
                .populate('franchiseId')
                .populate('hubId', 'hubName city pincode')
                .lean();
            if (!staff) {
                return { success: false, message: 'No active staff account found with this phone number' };
            }
            // Resolve role from AdminRole, FranchiseRole, or HubRole
            let roleData = null;
            if (staff.roleId) {
                roleData = await resolveRole(staff.roleId);
            }
            // Fetch franchise wallet if franchise staff
            let walletData = undefined;
            if (staff.type === 'franchise' && staff.franchiseId) {
                const franchiseIdStr = staff.franchiseId._id
                    ? staff.franchiseId._id.toString()
                    : staff.franchiseId.toString();
                const wallet = await wallet_model_1.Wallet.findOne({ userId: franchiseIdStr });
                walletData = wallet
                    ? { balance: wallet.balance, currency: wallet.currency }
                    : { balance: 0, currency: 'INR' };
            }
            // Remove password from franchise data if populated
            const franchiseData = staff.franchiseId ? { ...staff.franchiseId } : undefined;
            if (franchiseData && franchiseData.password) {
                delete franchiseData.password;
            }
            const token = (0, jwt_1.generateToken)(staff._id.toString());
            return {
                success: true,
                message: 'Login successful',
                data: {
                    id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    phone: staff.phone,
                    type: staff.type,
                    status: staff.status,
                    franchiseId: franchiseData,
                    hubId: staff.hubId,
                    roleId: roleData || staff.roleId,
                    token,
                    ...(walletData ? { wallet: walletData } : {}),
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error verifying OTP' };
        }
    }
}
exports.StaffService = StaffService;
exports.staffService = new StaffService();
