"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAgencyUser = exports.updateAgencyUserStatus = exports.updateAgencyUser = exports.createAgencyUser = exports.getAgencyUserById = exports.getAgencyUsers = void 0;
const staff_service_1 = require("../../services/admin/staff.service");
const staff_model_1 = require("../../models/admin/staff.model");
const parcelActor_1 = require("../../utils/parcelActor");
/**
 * Users of an agency.
 *
 * Several people can work one agency, each with their own phone number, and log
 * in through the single phone login (/admin/login). They are Staff records of
 * type 'franchise' pinned to the agency, so the existing franchise roles and
 * permissions apply unchanged.
 *
 * Scoped to the caller's own agency: an agency login manages its own users, and
 * so does an agency user who has been given the permission.
 */
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to manage agency users (or is inactive)',
        });
        return null;
    }
    return actor;
};
const agencyOf = (actor, res) => {
    if (!actor.agencyId) {
        res.status(403).json({ success: false, message: 'Agency access required' });
        return null;
    }
    return actor.agencyId;
};
/** A user may only be touched if they belong to the caller's agency */
const assertOwnUser = async (id, agencyId, res) => {
    const staff = await staff_model_1.Staff.findById(id).select('franchiseId type');
    if (!staff) {
        res.status(404).json({ success: false, message: 'User not found' });
        return false;
    }
    if (staff.franchiseId?.toString() !== agencyId) {
        res.status(403).json({
            success: false,
            message: 'This user belongs to another agency',
        });
        return false;
    }
    return true;
};
const getAgencyUsers = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const agencyId = agencyOf(actor, res);
        if (!agencyId)
            return;
        const result = await staff_service_1.staffService.getAllStaff(parseInt(req.query.page) || 1, parseInt(req.query.limit) || 10, req.query.search, req.query.status, agencyId, req.query.roleId, 'franchise');
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAgencyUsers = getAgencyUsers;
const getAgencyUserById = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const agencyId = agencyOf(actor, res);
        if (!agencyId)
            return;
        const id = req.params.id;
        if (!(await assertOwnUser(id, agencyId, res)))
            return;
        const result = await staff_service_1.staffService.getStaffById(id);
        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAgencyUserById = getAgencyUserById;
const createAgencyUser = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const agencyId = agencyOf(actor, res);
        if (!agencyId)
            return;
        // The agency and the type are taken from the caller, never from the body
        const result = await staff_service_1.staffService.createStaff({
            ...req.body,
            type: 'franchise',
            franchiseId: agencyId,
        });
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(201).json({
            success: true,
            message: 'Agency user created successfully. They can log in with their phone number.',
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.createAgencyUser = createAgencyUser;
const updateAgencyUser = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const agencyId = agencyOf(actor, res);
        if (!agencyId)
            return;
        const id = req.params.id;
        if (!(await assertOwnUser(id, agencyId, res)))
            return;
        // A user cannot be moved to another agency or another staff type from here
        const { franchiseId, type, hubId, collectionAgencyId, ...allowed } = req.body;
        const result = await staff_service_1.staffService.updateStaff(id, allowed);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateAgencyUser = updateAgencyUser;
const updateAgencyUserStatus = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const agencyId = agencyOf(actor, res);
        if (!agencyId)
            return;
        const id = req.params.id;
        if (!(await assertOwnUser(id, agencyId, res)))
            return;
        const result = await staff_service_1.staffService.updateStaffStatus(id, req.body.status);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateAgencyUserStatus = updateAgencyUserStatus;
const deleteAgencyUser = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const agencyId = agencyOf(actor, res);
        if (!agencyId)
            return;
        const id = req.params.id;
        // Don't let a user delete the account they are signed in with
        if (id === actor.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete the user you are logged in as',
            });
        }
        if (!(await assertOwnUser(id, agencyId, res)))
            return;
        const result = await staff_service_1.staffService.deleteStaff(id);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.deleteAgencyUser = deleteAgencyUser;
