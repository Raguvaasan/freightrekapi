"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgencyStatus = exports.getAgenciesByHub = exports.deleteAgency = exports.updateAgency = exports.getAgencyById = exports.getAllAgencies = exports.createAgency = exports.loginFranchise = void 0;
const agency_service_1 = require("../../services/admin/agency.service");
const loginFranchise = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await agency_service_1.agencyService.loginFranchise(username, password);
        if (!result.success) {
            return res.status(401).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            token: result.token,
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
exports.loginFranchise = loginFranchise;
const createAgency = async (req, res) => {
    try {
        const result = await agency_service_1.agencyService.createAgency(req.body);
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
exports.createAgency = createAgency;
const getAllAgencies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const result = await agency_service_1.agencyService.getAllAgencies(page, limit, search, status);
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
exports.getAllAgencies = getAllAgencies;
const getAgencyById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await agency_service_1.agencyService.getAgencyById(String(id));
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
exports.getAgencyById = getAgencyById;
const updateAgency = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await agency_service_1.agencyService.updateAgency(id, req.body);
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
exports.updateAgency = updateAgency;
const deleteAgency = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await agency_service_1.agencyService.deleteAgency(id);
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
exports.deleteAgency = deleteAgency;
const getAgenciesByHub = async (req, res) => {
    try {
        const { hubId } = req.params;
        return res.status(410).json({
            success: false,
            message: 'Assigned hub field is removed',
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAgenciesByHub = getAgenciesByHub;
const updateAgencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await agency_service_1.agencyService.updateAgencyStatus(id, status);
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
exports.updateAgencyStatus = updateAgencyStatus;
