"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const adminUser_model_1 = require("../models/admin/adminUser.model");
const staff_model_1 = require("../models/admin/staff.model");
const role_model_1 = require("../models/admin/role.model");
const franchiseRole_model_1 = require("../models/admin/franchiseRole.model");
const hubRole_model_1 = require("../models/hub/hubRole.model");
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
        // Check all staff types with their respective role collections
        const staff = await staff_model_1.Staff.findById(req.user.id);
        if (staff && staff.roleId) {
            if (staff.type === 'head_quarter') {
                role = await role_model_1.Role.findById(staff.roleId);
            }
            else if (staff.type === 'franchise') {
                role = await franchiseRole_model_1.FranchiseRole.findById(staff.roleId);
            }
            else if (staff.type === 'hub') {
                role = await hubRole_model_1.HubRole.findById(staff.roleId);
            }
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
