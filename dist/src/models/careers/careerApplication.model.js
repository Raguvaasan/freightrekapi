"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareerApplication = void 0;
const mongoose_1 = require("mongoose");
const careerApplicationSchema = new mongoose_1.Schema({
    jobPostingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    coveringMessage: {
        type: String,
        required: true,
        trim: true
    },
    resumePath: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'rejected', 'accepted'],
        default: 'pending'
    }
}, {
    timestamps: true
});
// Indexes for faster queries
careerApplicationSchema.index({ jobPostingId: 1 });
careerApplicationSchema.index({ email: 1 });
careerApplicationSchema.index({ status: 1 });
careerApplicationSchema.index({ createdAt: -1 });
exports.CareerApplication = (0, mongoose_1.model)('CareerApplication', careerApplicationSchema);
