"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHubId = exports.resolveAgencyId = exports.resolveParcelActor = void 0;
const adminUser_model_1 = require("../models/admin/adminUser.model");
const agency_model_1 = require("../models/admin/agency.model");
const hub_model_1 = require("../models/hub/hub.model");
const staff_model_1 = require("../models/admin/staff.model");
/**
 * Resolve who the authenticated caller is for the parcel flow.
 *
 * Every login in this app issues a token carrying only the record `_id`
 * (see utils/jwt generateToken), so the acting party is identified by
 * looking the id up across the login-capable collections:
 *   AdminUser            -> admin
 *   Agency               -> agency (direct agency login)
 *   Hub                  -> hub    (hub direct login)
 *   Staff head_quarter   -> admin
 *   Staff franchise      -> agency (franchiseId)
 *   Staff hub            -> hub    (hubId)
 */
const resolveParcelActor = async (userId) => {
    if (!userId)
        return null;
    const admin = await adminUser_model_1.AdminUser.findById(userId).select('name status');
    if (admin) {
        if (admin.status === false)
            return null;
        return { role: 'admin', id: userId, name: admin.name };
    }
    const agency = await agency_model_1.Agency.findById(userId).select('agencyName status');
    if (agency) {
        if (agency.status !== 'Active')
            return null;
        return {
            role: 'agency',
            id: userId,
            name: agency.agencyName,
            agencyId: agency._id.toString(),
        };
    }
    const hub = await hub_model_1.HubModel.findById(userId).select('hubName status');
    if (hub) {
        if (!hub.status)
            return null;
        return {
            role: 'hub',
            id: userId,
            name: hub.hubName,
            hubId: hub._id.toString(),
        };
    }
    const staff = await staff_model_1.Staff.findById(userId).select('name type status franchiseId hubId');
    if (staff) {
        if (staff.status !== 'Active')
            return null;
        if (staff.type === 'head_quarter') {
            return { role: 'admin', id: userId, name: staff.name };
        }
        if (staff.type === 'franchise' && staff.franchiseId) {
            return {
                role: 'agency',
                id: userId,
                name: staff.name,
                agencyId: staff.franchiseId.toString(),
            };
        }
        if (staff.type === 'hub' && staff.hubId) {
            return {
                role: 'hub',
                id: userId,
                name: staff.name,
                hubId: staff.hubId.toString(),
            };
        }
    }
    return null;
};
exports.resolveParcelActor = resolveParcelActor;
/**
 * The agency a caller acts for — the agency itself on a direct login, or the
 * agency an agency staff member belongs to.
 *
 * Controllers scoped to "my agency" need this rather than the token id: a staff
 * member's id is their own, not their agency's, so reading the token directly
 * scopes their screens to an agency that does not exist.
 */
const resolveAgencyId = async (userId) => {
    const actor = await (0, exports.resolveParcelActor)(userId);
    return actor?.role === 'agency' ? actor.agencyId ?? null : null;
};
exports.resolveAgencyId = resolveAgencyId;
/** The hub a caller acts for — the hub itself, or the hub its staff belongs to */
const resolveHubId = async (userId) => {
    const actor = await (0, exports.resolveParcelActor)(userId);
    return actor?.role === 'hub' ? actor.hubId ?? null : null;
};
exports.resolveHubId = resolveHubId;
