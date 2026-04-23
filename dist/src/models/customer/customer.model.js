"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
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
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
}, { timestamps: true });
// Fast lookup for uniqueness checks and search
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1, createdAt: -1 });
customerSchema.index({ name: 'text', email: 'text', phone: 'text', city: 'text' });
exports.Customer = (0, mongoose_1.model)('Customer', customerSchema);
