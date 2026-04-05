"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHubStaffStatus = exports.deleteHubStaff = exports.updateHubStaff = exports.createHubStaff = exports.getHubStaffById = exports.getHubStaff = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const staff_model_1 = require("../../models/admin/staff.model");
const hubRole_model_1 = require("../../models/hub/hubRole.model");
// List hub's own staff
const getHubStaff = async (hubId, page = 1, limit = 10, search) => {
    try {
        const skip = (page - 1) * limit;
        const query = { type: 'hub', hubId };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
            ];
        }
        const staffList = await staff_model_1.Staff.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('hubId', 'hubName city');
        for (const s of staffList) {
            if (s.roleId) {
                const roleData = await hubRole_model_1.HubRole.findById(s.roleId).select('roleName permissions').lean();
                if (roleData) {
                    s.roleId = roleData;
                }
            }
        }
        const total = await staff_model_1.Staff.countDocuments(query);
        return {
            success: true,
            data: {
                staff: staffList,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
        };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getHubStaff = getHubStaff;
// Get single hub staff by ID (must belong to this hub)
const getHubStaffById = async (hubId, staffId) => {
    try {
        if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
            return { success: false, message: 'Invalid staff ID' };
        }
        const staff = await staff_model_1.Staff.findOne({ _id: staffId, type: 'hub', hubId })
            .populate('hubId', 'hubName city');
        if (!staff) {
            return { success: false, message: 'Staff not found' };
        }
        if (staff.roleId) {
            const roleData = await hubRole_model_1.HubRole.findById(staff.roleId).select('roleName permissions').lean();
            if (roleData) {
                staff.roleId = roleData;
            }
        }
        return { success: true, data: staff };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getHubStaffById = getHubStaffById;
// Create hub staff (scoped to this hub)
const createHubStaff = async (hubId, data) => {
    try {
        const existingEmail = await staff_model_1.Staff.findOne({ email: data.email });
        if (existingEmail) {
            return { success: false, message: 'Email already exists' };
        }
        const existingUsername = await staff_model_1.Staff.findOne({ username: data.username });
        if (existingUsername) {
            return { success: false, message: 'Username already exists' };
        }
        if (data.roleId) {
            const roleExists = await hubRole_model_1.HubRole.findOne({ _id: data.roleId, hubId });
            if (!roleExists) {
                return { success: false, message: 'Role not found for this hub' };
            }
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, salt);
        const staff = new staff_model_1.Staff({
            ...data,
            type: 'hub',
            hubId,
            password: hashedPassword,
        });
        await staff.save();
        const populated = await staff_model_1.Staff.findById(staff._id).populate('hubId', 'hubName city');
        if (populated && populated.roleId) {
            const roleData = await hubRole_model_1.HubRole.findById(populated.roleId).select('roleName permissions').lean();
            if (roleData) {
                populated.roleId = roleData;
            }
        }
        return { success: true, message: 'Staff created successfully', data: populated };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.createHubStaff = createHubStaff;
// Update hub staff (must belong to this hub)
const updateHubStaff = async (hubId, staffId, data) => {
    try {
        if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
            return { success: false, message: 'Invalid staff ID' };
        }
        const staff = await staff_model_1.Staff.findOne({ _id: staffId, type: 'hub', hubId });
        if (!staff) {
            return { success: false, message: 'Staff not found' };
        }
        if (data.email && data.email !== staff.email) {
            const exists = await staff_model_1.Staff.findOne({ email: data.email, _id: { $ne: staffId } });
            if (exists) {
                return { success: false, message: 'Email already exists' };
            }
        }
        if (data.username && data.username !== staff.username) {
            const exists = await staff_model_1.Staff.findOne({ username: data.username, _id: { $ne: staffId } });
            if (exists) {
                return { success: false, message: 'Username already exists' };
            }
        }
        if (data.roleId) {
            const roleExists = await hubRole_model_1.HubRole.findOne({ _id: data.roleId, hubId });
            if (!roleExists) {
                return { success: false, message: 'Role not found for this hub' };
            }
        }
        const updateData = { ...data };
        delete updateData.type;
        delete updateData.hubId;
        if (data.password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash(data.password, salt);
        }
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] !== undefined) {
                staff[key] = updateData[key];
            }
        });
        await staff.save();
        const updated = await staff_model_1.Staff.findById(staffId).populate('hubId', 'hubName city');
        if (updated && updated.roleId) {
            const roleData = await hubRole_model_1.HubRole.findById(updated.roleId).select('roleName permissions').lean();
            if (roleData) {
                updated.roleId = roleData;
            }
        }
        return { success: true, message: 'Staff updated successfully', data: updated };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.updateHubStaff = updateHubStaff;
// Delete hub staff (must belong to this hub)
const deleteHubStaff = async (hubId, staffId) => {
    try {
        if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
            return { success: false, message: 'Invalid staff ID' };
        }
        const staff = await staff_model_1.Staff.findOneAndDelete({ _id: staffId, type: 'hub', hubId });
        if (!staff) {
            return { success: false, message: 'Staff not found' };
        }
        return { success: true, message: 'Staff deleted successfully' };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.deleteHubStaff = deleteHubStaff;
// Update hub staff status
const updateHubStaffStatus = async (hubId, staffId, status) => {
    try {
        if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
            return { success: false, message: 'Invalid staff ID' };
        }
        const staff = await staff_model_1.Staff.findOneAndUpdate({ _id: staffId, type: 'hub', hubId }, { status }, { new: true }).populate('hubId', 'hubName city');
        if (!staff) {
            return { success: false, message: 'Staff not found' };
        }
        return { success: true, message: 'Status updated successfully', data: staff };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.updateHubStaffStatus = updateHubStaffStatus;
