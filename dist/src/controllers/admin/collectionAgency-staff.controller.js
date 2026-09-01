"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollectionAgencyStaff = exports.updateCollectionAgencyStaffStatus = exports.updateCollectionAgencyStaff = exports.createCollectionAgencyStaff = exports.getCollectionAgencyStaffById = exports.getCollectionAgencyStaff = void 0;
const staff_service_1 = require("../../services/admin/staff.service");
// Get all staff for the logged-in collection agency
const getCollectionAgencyStaff = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id; // Collection agency user's ID from JWT token
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency authentication required',
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const roleId = req.query.roleId;
        // Force collectionAgencyId to be the logged-in collection agency
        const result = await staff_service_1.staffService.getAllStaff(page, limit, search, status, undefined, roleId, 'collection_agency', collectionAgencyId);
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
exports.getCollectionAgencyStaff = getCollectionAgencyStaff;
// Get staff by ID (only if belongs to collection agency)
const getCollectionAgencyStaffById = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const { id } = req.params;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency authentication required',
            });
        }
        const result = await staff_service_1.staffService.getStaffById(id);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
            });
        }
        // Verify that the staff belongs to this collection agency
        const staffAgencyId = result.data.collectionAgencyId?._id
            ? result.data.collectionAgencyId._id.toString()
            : result.data.collectionAgencyId?.toString();
        if (staffAgencyId !== collectionAgencyId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your collection agency',
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
exports.getCollectionAgencyStaffById = getCollectionAgencyStaffById;
// Create staff for the logged-in collection agency
const createCollectionAgencyStaff = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency authentication required',
            });
        }
        // Override type & collectionAgencyId with the logged-in collection agency's context
        const staffData = {
            ...req.body,
            type: 'collection_agency',
            collectionAgencyId: collectionAgencyId,
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
exports.createCollectionAgencyStaff = createCollectionAgencyStaff;
// Update staff (only if belongs to collection agency)
const updateCollectionAgencyStaff = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const { id } = req.params;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency authentication required',
            });
        }
        // First verify the staff belongs to this collection agency
        const staffResult = await staff_service_1.staffService.getStaffById(id);
        if (!staffResult.success) {
            return res.status(404).json({
                success: false,
                message: staffResult.message,
            });
        }
        const staffAgencyId = staffResult.data.collectionAgencyId?._id
            ? staffResult.data.collectionAgencyId._id.toString()
            : staffResult.data.collectionAgencyId?.toString();
        if (staffAgencyId !== collectionAgencyId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your collection agency',
            });
        }
        // Don't allow collection agency to change type or collectionAgencyId
        const updateData = { ...req.body };
        delete updateData.collectionAgencyId;
        delete updateData.type;
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
exports.updateCollectionAgencyStaff = updateCollectionAgencyStaff;
// Update staff status (only if belongs to collection agency)
const updateCollectionAgencyStaffStatus = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const { id } = req.params;
        const { status } = req.body;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency authentication required',
            });
        }
        // First verify the staff belongs to this collection agency
        const staffResult = await staff_service_1.staffService.getStaffById(id);
        if (!staffResult.success) {
            return res.status(404).json({
                success: false,
                message: staffResult.message,
            });
        }
        const staffAgencyId = staffResult.data.collectionAgencyId?._id
            ? staffResult.data.collectionAgencyId._id.toString()
            : staffResult.data.collectionAgencyId?.toString();
        if (staffAgencyId !== collectionAgencyId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your collection agency',
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
exports.updateCollectionAgencyStaffStatus = updateCollectionAgencyStaffStatus;
// Delete staff (only if belongs to collection agency)
const deleteCollectionAgencyStaff = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const { id } = req.params;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency authentication required',
            });
        }
        // First verify the staff belongs to this collection agency
        const staffResult = await staff_service_1.staffService.getStaffById(id);
        if (!staffResult.success) {
            return res.status(404).json({
                success: false,
                message: staffResult.message,
            });
        }
        const staffAgencyId = staffResult.data.collectionAgencyId?._id
            ? staffResult.data.collectionAgencyId._id.toString()
            : staffResult.data.collectionAgencyId?.toString();
        if (staffAgencyId !== collectionAgencyId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff does not belong to your collection agency',
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
exports.deleteCollectionAgencyStaff = deleteCollectionAgencyStaff;
