"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const adminUser_model_1 = require("../models/admin/adminUser.model");
const staff_model_1 = require("../models/admin/staff.model");
const role_model_1 = require("../models/admin/role.model");
const checkPermission = (module, action) => async (req, res, next) => {
    // First check if the user is an AdminUser
    const user = await adminUser_model_1.AdminUser
        .findById(req.user.id)
        .populate("roleId");
    let role = null;
    if (user && user.roleId) {
        role = user.roleId;
    }
    else {
        // If not an AdminUser, check if it's a head_quarter Staff with an admin role
        const staff = await staff_model_1.Staff.findById(req.user.id);
        if (staff && staff.type === 'head_quarter' && staff.roleId) {
            role = await role_model_1.Role.findById(staff.roleId);
        }
    }
    if (!role) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (role.isRoot) {
        return next();
    }
    const modulePermission = role.permissions.find((p) => p.module === module);
    if (!modulePermission || !modulePermission[action]) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }
    next();
};
exports.checkPermission = checkPermission;
