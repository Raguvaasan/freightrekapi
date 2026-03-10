"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPosting = void 0;
const mongoose_1 = require("mongoose");
const jobPostingSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    experience: {
        type: String,
        required: true,
        trim: true
    },
    qualification: {
        type: String,
        required: true,
        trim: true
    },
    shortDesc: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: [String],
        required: true,
        default: []
    },
    skills: {
        type: [String],
        required: true,
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Index for faster queries
jobPostingSchema.index({ isActive: 1 });
jobPostingSchema.index({ title: 1 });
exports.JobPosting = (0, mongoose_1.model)('JobPosting', jobPostingSchema);
