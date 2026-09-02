"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bVehicle = void 0;
const mongoose_1 = require("mongoose");
const b2bVehicleSchema = new mongoose_1.Schema({
    vehicleType: { type: String, required: true, trim: true },
    capacityKg: { type: Number, required: true, min: 0 },
    ratePerKm: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
b2bVehicleSchema.index({ status: 1, capacityKg: 1 });
exports.B2bVehicle = (0, mongoose_1.model)('B2bVehicle', b2bVehicleSchema);
