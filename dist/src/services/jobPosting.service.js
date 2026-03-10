"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobPostingService = void 0;
const jobPosting_model_1 = require("../models/careers/jobPosting.model");
const mongoose_1 = require("mongoose");
exports.jobPostingService = {
    // Get all active job postings
    getAllJobPostings: async () => {
        try {
            const jobPostings = await jobPosting_model_1.JobPosting.find({ isActive: true })
                .sort({ createdAt: -1 });
            return {
                success: true,
                data: jobPostings
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Get job posting by ID
    getJobPostingById: async (id) => {
        try {
            // Validate ID
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid job posting ID'
                };
            }
            const jobPosting = await jobPosting_model_1.JobPosting.findById(id);
            if (!jobPosting) {
                return {
                    success: false,
                    message: 'Job posting not found'
                };
            }
            return {
                success: true,
                data: jobPosting
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Create new job posting
    createJobPosting: async (jobPostingData) => {
        try {
            const jobPosting = new jobPosting_model_1.JobPosting(jobPostingData);
            const savedJobPosting = await jobPosting.save();
            return {
                success: true,
                message: 'Job posting created successfully',
                data: savedJobPosting
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Update job posting
    updateJobPosting: async (id, updateData) => {
        try {
            // Validate ID
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid job posting ID'
                };
            }
            // Check if job posting exists
            const jobPosting = await jobPosting_model_1.JobPosting.findById(id);
            if (!jobPosting) {
                return {
                    success: false,
                    message: 'Job posting not found'
                };
            }
            // Update the job posting
            const updatedJobPosting = await jobPosting_model_1.JobPosting.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            return {
                success: true,
                message: 'Job posting updated successfully',
                data: updatedJobPosting
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Delete job posting (soft delete)
    deleteJobPosting: async (id) => {
        try {
            // Validate ID
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid job posting ID'
                };
            }
            // Check if job posting exists
            const jobPosting = await jobPosting_model_1.JobPosting.findById(id);
            if (!jobPosting) {
                return {
                    success: false,
                    message: 'Job posting not found'
                };
            }
            // Soft delete by setting isActive to false
            const deletedJobPosting = await jobPosting_model_1.JobPosting.findByIdAndUpdate(id, { isActive: false }, { new: true });
            return {
                success: true,
                message: 'Job posting deleted successfully',
                data: deletedJobPosting
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    }
};
