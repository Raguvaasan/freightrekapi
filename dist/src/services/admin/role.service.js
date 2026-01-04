"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.getRolesById = exports.getRoles = exports.createRole = void 0;
const role_model_1 = require("../../models/admin/role.model");
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
        const roles = await role_model_1.Role.findById(id);
        return { success: true, data: roles };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getRolesById = getRolesById;
const updateRole = async (id, rb) => {
    try {
        const role = await role_model_1.Role.findByIdAndUpdate(id, rb, { new: true });
        if (!role) {
            return { success: false, message: "Role not found" };
        }
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, data: err.message };
    }
};
exports.updateRole = updateRole;
const deleteRole = async (id) => {
    try {
        const role = await role_model_1.Role.findByIdAndDelete(id);
        if (!role) {
            return { success: false, message: "Role not found" };
        }
        return { success: true, message: "Role deleted" };
    }
    catch (err) {
        return { success: false, data: err.message };
    }
};
exports.deleteRole = deleteRole;
