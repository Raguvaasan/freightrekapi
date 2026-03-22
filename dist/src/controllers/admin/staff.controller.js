"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStaffStatus = exports.deleteStaff = exports.updateStaff = exports.getStaffById = exports.getAllStaff = exports.createStaff = exports.loginHubStaff = exports.loginHeadQuarterStaff = exports.loginFranchiseStaff = exports.loginStaff = void 0;
const staff_service_1 = require("../../services/admin/staff.service");
const loginStaff = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await staff_service_1.staffService.loginStaff(username, password);
        if (!result.success) {
            return res.status(401).json({
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
exports.loginStaff = loginStaff;
const loginFranchiseStaff = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await staff_service_1.staffService.loginFranchiseStaff(username, password);
        if (!result.success) {
            return res.status(401).json({
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
exports.loginFranchiseStaff = loginFranchiseStaff;
const loginHeadQuarterStaff = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await staff_service_1.staffService.loginHeadQuarterStaff(username, password);
        if (!result.success) {
            return res.status(401).json({
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
exports.loginHeadQuarterStaff = loginHeadQuarterStaff;
const loginHubStaff = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await staff_service_1.staffService.loginHubStaff(username, password);
        if (!result.success) {
            return res.status(401).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.loginHubStaff = loginHubStaff;
const createStaff = async (req, res) => {
    try {
        const result = await staff_service_1.staffService.createStaff(req.body);
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
exports.createStaff = createStaff;
const getAllStaff = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const franchiseId = req.query.franchiseId;
        const roleId = req.query.roleId;
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
exports.getAllStaff = getAllStaff;
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await staff_service_1.staffService.getStaffById(id);
        if (!result.success) {
            return res.status(404).json({
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
exports.getStaffById = getStaffById;
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await staff_service_1.staffService.updateStaff(id, req.body);
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
exports.updateStaff = updateStaff;
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await staff_service_1.staffService.deleteStaff(id);
        if (!result.success) {
            return res.status(404).json({
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
exports.deleteStaff = deleteStaff;
const updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
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
exports.updateStaffStatus = updateStaffStatus;
