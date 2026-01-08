"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agency = void 0;
const mongoose_1 = require("mongoose");
const agencySchema = new mongoose_1.Schema({
    agencyName: {
        type: String,
        required: [true, 'Agency name is required'],
        trim: true,
    },
    agencyOwner: {
        type: String,
        required: [true, 'Agency owner is required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    agencyType: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    address: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    pincode: {
        type: String,
        trim: true,
    },
    gstNumber: {
        type: String,
        trim: true,
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
// Index for faster queries
agencySchema.index({ agencyName: 1 });
agencySchema.index({ status: 1 });
exports.Agency = (0, mongoose_1.model)('Agency', agencySchema);
