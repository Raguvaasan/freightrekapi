"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = void 0;
const mongoose_1 = require("mongoose");
const driverSchema = new mongoose_1.Schema({
    driverName: {
        type: String,
        required: [true, 'Driver name is required'],
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true,
        uppercase: true,
        unique: true,
    },
    dateOfExpiry: {
        type: Date,
        required: [true, 'Date of expiry is required'],
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
}, {
    timestamps: true,
});
driverSchema.index({ status: 1 });
exports.Driver = (0, mongoose_1.model)('Driver', driverSchema);
