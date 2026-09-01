"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vehicle = void 0;
const mongoose_1 = require("mongoose");
const vehicleSchema = new mongoose_1.Schema({
    vehicleType: {
        type: String,
        required: [true, 'Vehicle type is required'],
        trim: true,
    },
    capacity: {
        type: String,
        required: [true, 'Capacity is required'],
        trim: true,
    },
    vehicleRegistrationNumber: {
        type: String,
        required: [true, 'Vehicle registration number is required'],
        trim: true,
        uppercase: true,
        unique: true,
    },
    rcNumber: {
        type: String,
        required: [true, 'RC number is required'],
        trim: true,
    },
    insuranceNumber: {
        type: String,
        required: [true, 'Insurance number is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
}, {
    timestamps: true,
});
vehicleSchema.index({ status: 1 });
exports.Vehicle = (0, mongoose_1.model)('Vehicle', vehicleSchema);
