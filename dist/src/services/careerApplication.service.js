"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.careerApplicationService = void 0;
const careerApplication_model_1 = require("../models/careers/careerApplication.model");
const mongoose_1 = require("mongoose");
exports.careerApplicationService = {
    // Get all applications (with optional filters)
    getAllApplications: async (filters, page = 1, limit = 10) => {
        try {
            const skip = (page - 1) * limit;
            // Build filter object
            const filterObj = {};
            if (filters?.jobPostingId) {
                if (!mongoose_1.Types.ObjectId.isValid(filters.jobPostingId)) {
                    return {
                        success: false,
                        message: 'Invalid job posting ID'
                    };
                }
                filterObj.jobPostingId = new mongoose_1.Types.ObjectId(filters.jobPostingId);
            }
            if (filters?.status) {
                filterObj.status = filters.status;
            }
            if (filters?.email) {
                filterObj.email = { $regex: filters.email, $options: 'i' };
            }
            const applications = await careerApplication_model_1.CareerApplication.find(filterObj)
                .populate('jobPostingId', 'title')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await careerApplication_model_1.CareerApplication.countDocuments(filterObj);
            return {
                success: true,
                data: {
                    applications,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                }
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Get application by ID
    getApplicationById: async (id) => {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid application ID'
                };
            }
            const application = await careerApplication_model_1.CareerApplication.findById(id).populate('jobPostingId');
            if (!application) {
                return {
                    success: false,
                    message: 'Application not found'
                };
            }
            return {
                success: true,
                data: application
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Create new application
    createApplication: async (applicationData) => {
        try {
            // Validate jobPostingId
            if (!mongoose_1.Types.ObjectId.isValid(applicationData.jobPostingId)) {
                return {
                    success: false,
                    message: 'Invalid job posting ID'
                };
            }
            // Check if email already applied for this job
            const existingApplication = await careerApplication_model_1.CareerApplication.findOne({
                email: applicationData.email,
                jobPostingId: applicationData.jobPostingId
            });
            if (existingApplication) {
                return {
                    success: false,
                    message: 'You have already applied for this position'
                };
            }
            const application = new careerApplication_model_1.CareerApplication(applicationData);
            const savedApplication = await application.save();
            const populatedApplication = await careerApplication_model_1.CareerApplication.findById(savedApplication._id)
                .populate('jobPostingId', 'title');
            return {
                success: true,
                message: 'Application submitted successfully',
                data: populatedApplication
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Update application
    updateApplication: async (id, updateData) => {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid application ID'
                };
            }
            // Check if application exists
            const application = await careerApplication_model_1.CareerApplication.findById(id);
            if (!application) {
                return {
                    success: false,
                    message: 'Application not found'
                };
            }
            // Update the application
            const updatedApplication = await careerApplication_model_1.CareerApplication.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('jobPostingId', 'title');
            return {
                success: true,
                message: 'Application updated successfully',
                data: updatedApplication
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Delete application
    deleteApplication: async (id) => {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid application ID'
                };
            }
            // Check if application exists
            const application = await careerApplication_model_1.CareerApplication.findById(id);
            if (!application) {
                return {
                    success: false,
                    message: 'Application not found'
                };
            }
            // Delete the application
            await careerApplication_model_1.CareerApplication.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Application deleted successfully'
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Get applications by job posting
    getApplicationsByJobPosting: async (jobPostingId) => {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(jobPostingId)) {
                return {
                    success: false,
                    message: 'Invalid job posting ID'
                };
            }
            const applications = await careerApplication_model_1.CareerApplication.find({ jobPostingId })
                .sort({ createdAt: -1 })
                .populate('jobPostingId', 'title');
            return {
                success: true,
                data: applications
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
