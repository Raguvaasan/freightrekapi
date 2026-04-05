"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHubRole = exports.updateHubRole = exports.getHubRoleById = exports.getHubRoles = exports.createHubRole = void 0;
const hubRole_model_1 = require("../../models/hub/hubRole.model");
const createHubRole = async (hubId, rb) => {
    try {
        const role = await hubRole_model_1.HubRole.create({
            ...rb,
            hubId,
        });
        return { success: true, data: role };
    }
    catch (err) {
        if (err.code === 11000) {
            return { success: false, message: 'Role name already exists for this hub' };
        }
        return { success: false, message: err.message };
    }
};
exports.createHubRole = createHubRole;
const getHubRoles = async (hubId) => {
    try {
        const roles = await hubRole_model_1.HubRole.find({ hubId });
        return { success: true, data: roles };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getHubRoles = getHubRoles;
const getHubRoleById = async (hubId, roleId) => {
    try {
        const role = await hubRole_model_1.HubRole.findOne({ _id: roleId, hubId });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getHubRoleById = getHubRoleById;
const updateHubRole = async (hubId, roleId, rb) => {
    try {
        const role = await hubRole_model_1.HubRole.findOneAndUpdate({ _id: roleId, hubId }, rb, { new: true });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }
    catch (err) {
        if (err.code === 11000) {
            return { success: false, message: 'Role name already exists for this hub' };
        }
        return { success: false, message: err.message };
    }
};
exports.updateHubRole = updateHubRole;
const deleteHubRole = async (hubId, roleId) => {
    try {
        const role = await hubRole_model_1.HubRole.findOneAndDelete({ _id: roleId, hubId });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, message: 'Role deleted successfully' };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.deleteHubRole = deleteHubRole;
