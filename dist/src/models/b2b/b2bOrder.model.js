"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bOrder = exports.B2B_ORDER_STATUSES = void 0;
const mongoose_1 = require("mongoose");
exports.B2B_ORDER_STATUSES = ['DRAFT', 'CONFIRMED', 'ORDER_CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'];
const b2bOrderSchema = new mongoose_1.Schema({
    b2bUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'B2bUser', required: true, index: true },
    lrNo: { type: String, trim: true, uppercase: true, index: true, unique: true, sparse: true },
    waybill: { type: String, trim: true, uppercase: true },
    status: { type: String, enum: exports.B2B_ORDER_STATUSES, default: 'DRAFT', index: true },
    bookingCustomer: {
        name: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
    },
    deliveryCustomer: {
        name: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
    },
    shipment: {
        approximateWeight: { type: Number, required: true, min: 0 },
    },
    driverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Driver' },
    driver: {
        driverName: { type: String, trim: true },
        phoneNumber: { type: String, trim: true },
        licenseNumber: { type: String, trim: true, uppercase: true },
    },
    selectedVehicleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'B2bVehicle' },
    selectedVehicle: {
        vehicleType: { type: String },
        capacityKg: { type: Number },
    },
    distanceKm: { type: Number, min: 0 },
    ratePerKm: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
}, { timestamps: true });
exports.B2bOrder = (0, mongoose_1.model)('B2bOrder', b2bOrderSchema);
