"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollectionAgencyRole = exports.updateCollectionAgencyRole = exports.getCollectionAgencyRoleById = exports.getCollectionAgencyRoles = exports.createCollectionAgencyRole = void 0;
const collectionAgencyRole_model_1 = require("../../models/admin/collectionAgencyRole.model");
const createCollectionAgencyRole = async (collectionAgencyId, rb) => {
    try {
        const role = await collectionAgencyRole_model_1.CollectionAgencyRole.create({
            ...rb,
            collectionAgencyId,
        });
        return { success: true, data: role };
    }
    catch (err) {
        if (err.code === 11000) {
            return { success: false, message: 'Role name already exists for this collection agency' };
        }
        return { success: false, message: err.message };
    }
};
exports.createCollectionAgencyRole = createCollectionAgencyRole;
const getCollectionAgencyRoles = async (collectionAgencyId) => {
    try {
        const roles = await collectionAgencyRole_model_1.CollectionAgencyRole.find({ collectionAgencyId });
        return { success: true, data: roles };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getCollectionAgencyRoles = getCollectionAgencyRoles;
const getCollectionAgencyRoleById = async (collectionAgencyId, roleId) => {
    try {
        const role = await collectionAgencyRole_model_1.CollectionAgencyRole.findOne({ _id: roleId, collectionAgencyId });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getCollectionAgencyRoleById = getCollectionAgencyRoleById;
const updateCollectionAgencyRole = async (collectionAgencyId, roleId, rb) => {
    try {
        const role = await collectionAgencyRole_model_1.CollectionAgencyRole.findOneAndUpdate({ _id: roleId, collectionAgencyId }, rb, { new: true });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }
    catch (err) {
        if (err.code === 11000) {
            return { success: false, message: 'Role name already exists for this collection agency' };
        }
        return { success: false, message: err.message };
    }
};
exports.updateCollectionAgencyRole = updateCollectionAgencyRole;
const deleteCollectionAgencyRole = async (collectionAgencyId, roleId) => {
    try {
        const role = await collectionAgencyRole_model_1.CollectionAgencyRole.findOneAndDelete({ _id: roleId, collectionAgencyId });
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, message: 'Role deleted successfully' };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.deleteCollectionAgencyRole = deleteCollectionAgencyRole;
