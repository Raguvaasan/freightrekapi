"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFranchiseStaff = exports.updateFranchiseStaffStatus = exports.updateFranchiseStaff = exports.createFranchiseStaff = exports.getFranchiseStaffById = exports.getFranchiseStaff = void 0;
const staff_service_1 = require("../../services/admin/staff.service");
const parcelActor_1 = require("../../utils/parcelActor");
/**
 * The agency whose staff these are. A direct agency login is the agency; an
 * agency staff member has an id of their own, so the agency is read off their
 * record.
 */
const agencyOf = (req) => req.parcelActor?.agencyId
    ? Promise.resolve(req.parcelActor.agencyId)
    : (0, parcelActor_1.resolveAgencyId)(req.user?.id);
// Get all staff for the logged-in franchise
const getFranchiseStaff = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise authentication required',
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const roleId = req.query.roleId;
        // Force franchiseId to be the logged-in franchise
        const result = await staff_service_1.staffService.getAllStaff(page, limit, search, status, franchiseId, roleId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
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
exports.getFranchiseStaff = getFranchiseStaff;
// Get staff by ID (only if belongs to franchise)
const getFranchiseStaffById = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const { id } = req.params;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise authentication required',
            });
        }
        const result = await staff_service_1.staffService.getStaffById(id);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
            });
        }
        // Verify that the staff belongs to this franchise
        if (result.data.franchiseId._id.toString() !== franchiseId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your franchise',
            });
        }
        return res.status(200).json({
            success: true,
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
exports.getFranchiseStaffById = getFranchiseStaffById;
// Create staff for the logged-in franchise
const createFranchiseStaff = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise authentication required',
            });
        }
        // Override franchiseId with the logged-in franchise's ID
        const staffData = {
            ...req.body,
            franchiseId: franchiseId,
        };
        const result = await staff_service_1.staffService.createStaff(staffData);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(201).json({
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
exports.createFranchiseStaff = createFranchiseStaff;
// Update staff (only if belongs to franchise)
const updateFranchiseStaff = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const { id } = req.params;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise authentication required',
            });
        }
        // First verify the staff belongs to this franchise
        const staffResult = await staff_service_1.staffService.getStaffById(id);
        if (!staffResult.success) {
            return res.status(404).json({
                success: false,
                message: staffResult.message,
            });
        }
        if (staffResult.data.franchiseId._id.toString() !== franchiseId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your franchise',
            });
        }
        // Don't allow franchise to change franchiseId
        const updateData = { ...req.body };
        delete updateData.franchiseId;
        const result = await staff_service_1.staffService.updateStaff(id, updateData);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
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
exports.updateFranchiseStaff = updateFranchiseStaff;
// Update staff status (only if belongs to franchise)
const updateFranchiseStaffStatus = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const { id } = req.params;
        const { status } = req.body;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise authentication required',
            });
        }
        // First verify the staff belongs to this franchise
        const staffResult = await staff_service_1.staffService.getStaffById(id);
        if (!staffResult.success) {
            return res.status(404).json({
                success: false,
                message: staffResult.message,
            });
        }
        if (staffResult.data.franchiseId._id.toString() !== franchiseId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your franchise',
            });
        }
        const result = await staff_service_1.staffService.updateStaffStatus(id, status);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
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
exports.updateFranchiseStaffStatus = updateFranchiseStaffStatus;
// Delete staff (only if belongs to franchise)
const deleteFranchiseStaff = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const { id } = req.params;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise authentication required',
            });
        }
        // First verify the staff belongs to this franchise
        const staffResult = await staff_service_1.staffService.getStaffById(id);
        if (!staffResult.success) {
            return res.status(404).json({
                success: false,
                message: staffResult.message,
            });
        }
        if (staffResult.data.franchiseId._id.toString() !== franchiseId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your franchise',
            });
        }
        const result = await staff_service_1.staffService.deleteStaff(id);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.deleteFranchiseStaff = deleteFranchiseStaff;
