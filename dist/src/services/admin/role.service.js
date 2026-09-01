"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.getRolesById = exports.getRoles = exports.createRole = void 0;
const mongoose_1 = require("mongoose");
const role_model_1 = require("../../models/admin/role.model");
/** A malformed id must read as "invalid id", not as a Mongoose cast failure */
const invalidId = (id) => !id || !mongoose_1.Types.ObjectId.isValid(id);
const createRole = async (rb) => {
    try {
        const role = await role_model_1.Role.create(rb);
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.createRole = createRole;
const getRoles = async () => {
    try {
        const roles = await role_model_1.Role.find();
        return { success: true, data: roles };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getRoles = getRoles;
const getRolesById = async (id) => {
    try {
        if (invalidId(id)) {
            return { success: false, message: "Invalid role ID" };
        }
        const role = await role_model_1.Role.findById(id);
        if (!role) {
            return { success: false, message: "Role not found" };
        }
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getRolesById = getRolesById;
const updateRole = async (id, rb) => {
    try {
        if (invalidId(id)) {
            return { success: false, message: "Invalid role ID" };
        }
        const role = await role_model_1.Role.findByIdAndUpdate(id, rb, { new: true });
        if (!role) {
            return { success: false, message: "Role not found" };
        }
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.updateRole = updateRole;
const deleteRole = async (id) => {
    try {
        if (invalidId(id)) {
            return { success: false, message: "Invalid role ID" };
        }
        const role = await role_model_1.Role.findByIdAndDelete(id);
        if (!role) {
            return { success: false, message: "Role not found" };
        }
        return { success: true, message: "Role deleted" };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.deleteRole = deleteRole;
