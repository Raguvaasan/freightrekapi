"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFranchiseRole = exports.updateFranchiseRole = exports.getFranchiseRoleById = exports.getFranchiseRoles = exports.createFranchiseRole = void 0;
const franchiseRole_model_1 = require("../../models/admin/franchiseRole.model");
const createFranchiseRole = async (franchiseId, rb) => {
    try {
        const role = await franchiseRole_model_1.FranchiseRole.create({
            ...rb,
            franchiseId
        });
        return { success: true, data: role };
    }
    catch (err) {
        if (err.code === 11000) {
            return { success: false, message: 'Role name already exists for this franchise' };
        }
        return { success: false, message: err.message };
    }
};
exports.createFranchiseRole = createFranchiseRole;
const getFranchiseRoles = async (franchiseId) => {
    try {
        const roles = await franchiseRole_model_1.FranchiseRole.find({ franchiseId });
        return { success: true, data: roles };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getFranchiseRoles = getFranchiseRoles;
const getFranchiseRoleById = async (franchiseId, roleId) => {
    try {
        const role = await franchiseRole_model_1.FranchiseRole.findOne({ _id: roleId, franchiseId });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getFranchiseRoleById = getFranchiseRoleById;
const updateFranchiseRole = async (franchiseId, roleId, rb) => {
    try {
        const role = await franchiseRole_model_1.FranchiseRole.findOneAndUpdate({ _id: roleId, franchiseId }, rb, { new: true });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }
    catch (err) {
        if (err.code === 11000) {
            return { success: false, message: 'Role name already exists for this franchise' };
        }
        return { success: false, message: err.message };
    }
};
exports.updateFranchiseRole = updateFranchiseRole;
const deleteFranchiseRole = async (franchiseId, roleId) => {
    try {
        const role = await franchiseRole_model_1.FranchiseRole.findOneAndDelete({ _id: roleId, franchiseId });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, message: 'Role deleted successfully' };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.deleteFranchiseRole = deleteFranchiseRole;
