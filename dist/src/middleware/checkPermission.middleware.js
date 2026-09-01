"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.roleAllows = exports.resolveUserRole = void 0;
const mongoose_1 = require("mongoose");
const adminUser_model_1 = require("../models/admin/adminUser.model");
const staff_model_1 = require("../models/admin/staff.model");
const role_model_1 = require("../models/admin/role.model");
const franchiseRole_model_1 = require("../models/admin/franchiseRole.model");
const hubRole_model_1 = require("../models/hub/hubRole.model");
/**
 * The role record backing a login, with the side it governs, or null when the
 * account carries none.
 *
 * A direct Agency / Hub login has no role record at all — it *is* the owner of
 * its area — which is why callers distinguish "no role record" from "role
 * record without the permission" instead of denying both.
 */
const resolveUserRole = async (userId) => {
    if (!userId || !mongoose_1.Types.ObjectId.isValid(userId))
        return null;
    const user = await adminUser_model_1.AdminUser.findById(userId).populate("roleId");
    if (user && user.roleId)
        return { role: user.roleId, scope: "admin" };
    // Every staff type keeps its permissions in its own role collection
    const staff = await staff_model_1.Staff.findById(userId);
    if (staff && staff.roleId) {
        if (staff.type === 'head_quarter') {
            const role = await role_model_1.Role.findById(staff.roleId);
            return role ? { role, scope: "admin" } : null;
        }
        if (staff.type === 'franchise') {
            const role = await franchiseRole_model_1.FranchiseRole.findById(staff.roleId);
            return role ? { role, scope: "agency" } : null;
        }
        if (staff.type === 'hub') {
            const role = await hubRole_model_1.HubRole.findById(staff.roleId);
            return role ? { role, scope: "hub" } : null;
        }
    }
    return null;
};
exports.resolveUserRole = resolveUserRole;
/** Does this role record grant `action` on `module`? A root role grants everything. */
const roleAllows = (role, module, action) => {
    if (!role)
        return false;
    if (role.isRoot)
        return true;
    const modulePermission = (role.permissions || []).find((p) => p.module === module);
    return !!(modulePermission && modulePermission[action]);
};
exports.roleAllows = roleAllows;
/**
 * Permission gate for an admin-side route.
 *
 * Only an admin role passes: an AdminUser's role, or the Role on a head-office
 * staff member. A franchise / hub staff member is refused here whatever their
 * own role says — those sides are gated by requireModulePermission instead.
 */
const checkPermission = (module, action) => async (req, res, next) => {
    try {
        // authMiddleware must run first; without it there is nobody to check
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const resolved = await (0, exports.resolveUserRole)(req.user.id);
        if (!resolved || resolved.scope !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        if (!(0, exports.roleAllows)(resolved.role, module, action)) {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }
        return next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error checking permissions",
        });
    }
};
exports.checkPermission = checkPermission;
