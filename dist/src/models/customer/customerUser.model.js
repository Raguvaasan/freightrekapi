"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerUser = void 0;
const mongoose_1 = require("mongoose");
const customerUserSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
    },
    gst: {
        type: String,
        required: [true, 'GST number is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Pending'],
        default: 'Pending',
    },
}, { timestamps: true });
exports.CustomerUser = (0, mongoose_1.model)('CustomerUser', customerUserSchema);
