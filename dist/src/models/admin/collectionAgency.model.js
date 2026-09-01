"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionAgency = void 0;
const mongoose_1 = require("mongoose");
const collectionAgencySchema = new mongoose_1.Schema({
    collectionAgencyName: {
        type: String,
        required: [true, 'Collection agency name is required'],
        trim: true,
    },
    ownerName: {
        type: String,
        required: [true, 'Owner name is required'],
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
// Indexes for faster queries
collectionAgencySchema.index({ collectionAgencyName: 1 });
collectionAgencySchema.index({ status: 1 });
exports.CollectionAgency = (0, mongoose_1.model)('CollectionAgency', collectionAgencySchema);
