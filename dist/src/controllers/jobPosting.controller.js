"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJobPosting = exports.updateJobPosting = exports.createJobPosting = exports.getJobPostingById = exports.getAllJobPostings = void 0;
const jobPosting_service_1 = require("../services/jobPosting.service");
// Get all job postings
const getAllJobPostings = async (req, res) => {
    try {
        const result = await jobPosting_service_1.jobPostingService.getAllJobPostings();
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
exports.getAllJobPostings = getAllJobPostings;
// Get job posting by ID
const getJobPostingById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Job posting ID is required'
            });
        }
        const result = await jobPosting_service_1.jobPostingService.getJobPostingById(id);
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
exports.getJobPostingById = getJobPostingById;
// Create new job posting (admin only)
const createJobPosting = async (req, res) => {
    try {
        const result = await jobPosting_service_1.jobPostingService.createJobPosting(req.body);
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
exports.createJobPosting = createJobPosting;
// Update job posting (admin only)
const updateJobPosting = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Job posting ID is required'
            });
        }
        const result = await jobPosting_service_1.jobPostingService.updateJobPosting(id, req.body);
        if (!result.success) {
            return res.status(400).json({
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
exports.updateJobPosting = updateJobPosting;
// Delete job posting (admin only)
const deleteJobPosting = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Job posting ID is required'
            });
        }
        const result = await jobPosting_service_1.jobPostingService.deleteJobPosting(id);
        if (!result.success) {
            return res.status(400).json({
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
exports.deleteJobPosting = deleteJobPosting;
