"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const adminUser_model_1 = require("../models/admin/adminUser.model");
const checkPermission = (module, action) => async (req, res, next) => {
    const user = await adminUser_model_1.AdminUser
        .findById(req.user.id)
        .populate("roleId");
    if (!user || !user.roleId) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    const role = user.roleId;
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
