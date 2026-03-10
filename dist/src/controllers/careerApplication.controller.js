"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationsByJobPosting = exports.deleteApplication = exports.updateApplication = exports.createApplication = exports.getApplicationById = exports.getAllApplications = void 0;
const careerApplication_service_1 = require("../services/careerApplication.service");
// Get all applications with filters
const getAllApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            jobPostingId: req.query.jobPostingId,
            status: req.query.status,
            email: req.query.email
        };
        const result = await careerApplication_service_1.careerApplicationService.getAllApplications(filters, page, limit);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getAllApplications = getAllApplications;
// Get application by ID
const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Application ID is required'
            });
        }
        const result = await careerApplication_service_1.careerApplicationService.getApplicationById(id);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getApplicationById = getApplicationById;
// Create new application
const createApplication = async (req, res) => {
    try {
        const result = await careerApplication_service_1.careerApplicationService.createApplication(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.createApplication = createApplication;
// Update application status or details
const updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Application ID is required'
            });
        }
        // Only admin can update status
        if (req.body.status && typeof req.user === 'undefined') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can update application status'
            });
        }
        const result = await careerApplication_service_1.careerApplicationService.updateApplication(id, req.body);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.updateApplication = updateApplication;
// Delete application
const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Application ID is required'
            });
        }
        const result = await careerApplication_service_1.careerApplicationService.deleteApplication(id);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.deleteApplication = deleteApplication;
// Get applications by job posting
const getApplicationsByJobPosting = async (req, res) => {
    try {
        const { jobPostingId } = req.params;
        if (!jobPostingId) {
            return res.status(400).json({
                success: false,
                message: 'Job posting ID is required'
            });
        }
        const result = await careerApplication_service_1.careerApplicationService.getApplicationsByJobPosting(jobPostingId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getApplicationsByJobPosting = getApplicationsByJobPosting;
