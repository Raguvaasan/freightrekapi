"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireModulePermission = exports.requireAdminPermission = exports.requireParcelRole = void 0;
const parcelActor_1 = require("../utils/parcelActor");
const checkPermission_middleware_1 = require("./checkPermission.middleware");
/**
 * Resolve the acting party (admin / agency / hub) from the JWT and reject
 * anyone whose role is not allowed on this route group. Attaches the resolved
 * actor to `req.parcelActor` so the controller does not look it up again.
 */
const requireParcelRole = (...roles) => async (req, res, next) => {
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        return res.status(403).json({
            success: false,
            message: 'Account is not allowed to access the parcel flow (or is inactive)',
        });
    }
    if (!roles.includes(actor.role)) {
        return res.status(403).json({
            success: false,
            message: `${roles.join(' / ')} access required`,
        });
    }
    req.parcelActor = actor;
    next();
};
exports.requireParcelRole = requireParcelRole;
/**
 * Is this caller the account that *owns* the module rather than a staff member
 * working inside it?
 *
 * A direct Agency or Hub login carries no role record — the token is the agency
 * / hub record itself — so it is the owner and every module of its own area is
 * open to it. A staff member logging into the same area is a different id from
 * the agency / hub they belong to, and is measured against the FranchiseRole /
 * HubRole attached to them.
 */
const isModuleOwner = (actor) => (actor.role === 'agency' && actor.id === actor.agencyId) ||
    (actor.role === 'hub' && actor.id === actor.hubId);
/**
 * Run the role/permission check only for an admin caller.
 *
 * Kept for routes shared by admin and a direct agency login, where the
 * isolation for the agency comes from the actor scope the controller applies.
 * Prefer `requireModulePermission` on anything a staff member can reach.
 *
 * Must be mounted after requireParcelRole, which resolves `req.parcelActor`.
 */
const requireAdminPermission = (module, action) => {
    const guard = (0, checkPermission_middleware_1.checkPermission)(module, action);
    return (req, res, next) => req.parcelActor?.role === 'admin' ? guard(req, res, next) : next();
};
exports.requireAdminPermission = requireAdminPermission;
/**
 * Permission gate for a route reachable by more than one kind of login.
 *
 * The three areas keep their permissions in separate collections and name their
 * modules differently ("Parcel Management" on the admin side, the agency's own
 * list on the franchise side, and so on), so the caller states the module per
 * role and the acting party decides which one applies:
 *
 *   admin  -> AdminUser role, or the Role on a head-office staff member
 *   agency -> direct agency login passes; agency staff -> FranchiseRole
 *   hub    -> direct hub login passes; hub staff -> HubRole
 *
 * A role with no entry for the module is denied, which is what makes a staff
 * login narrower than the agency / hub login it belongs to. Omitting a role
 * from `modules` leaves that role ungated on this route.
 *
 * Must be mounted after requireParcelRole, which resolves `req.parcelActor`.
 */
const requireModulePermission = (modules, action) => async (req, res, next) => {
    try {
        const actor = req.parcelActor || (await (0, parcelActor_1.resolveParcelActor)(req.user?.id));
        if (!actor) {
            return res.status(403).json({
                success: false,
                message: 'Account is not allowed here (or is inactive)',
            });
        }
        const configured = modules[actor.role];
        // Not gated for this kind of caller
        if (!configured)
            return next();
        // The agency / hub itself owns every module of its own area
        if (isModuleOwner(actor))
            return next();
        const names = Array.isArray(configured) ? configured : [configured];
        const resolved = await (0, checkPermission_middleware_1.resolveUserRole)(actor.id);
        // The role must govern the same side the caller is acting on: module
        // names collide across the three collections, so a franchise role must
        // never satisfy a hub route (or an admin one) that happens to share a name
        if (!resolved || resolved.scope !== actor.role) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (!names.some((name) => (0, checkPermission_middleware_1.roleAllows)(resolved.role, name, action))) {
            return res.status(403).json({
                success: false,
                message: `Permission denied for "${names[0]}"`,
            });
        }
        return next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Error checking permissions',
        });
    }
};
exports.requireModulePermission = requireModulePermission;
