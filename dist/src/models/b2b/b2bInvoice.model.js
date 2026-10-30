"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bInvoice = void 0;
const mongoose_1 = require("mongoose");
const partySchema = new mongoose_1.Schema({
    name: { type: String, trim: true },
    companyName: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
}, { _id: false });
const b2bInvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: 'B2bOrder', required: true, unique: true },
    orderNumber: { type: String, required: true, trim: true },
    b2bUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'B2bUser', required: true, index: true },
    invoiceDate: { type: Date, default: Date.now },
    billTo: { type: partySchema, default: () => ({}) },
    shipTo: { type: partySchema, default: () => ({}) },
    pickupAddress: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    lrNo: { type: String, trim: true, uppercase: true },
    waybill: { type: String, trim: true, uppercase: true },
    orderStatus: { type: String, trim: true },
    shipment: {
        approximateWeight: { type: Number, min: 0 },
    },
    driver: {
        driverName: { type: String, trim: true },
        phoneNumber: { type: String, trim: true },
        licenseNumber: { type: String, trim: true, uppercase: true },
    },
    vehicle: {
        vehicleType: { type: String, trim: true },
        registrationNumber: { type: String, trim: true, uppercase: true },
        insuranceNumber: { type: String, trim: true, uppercase: true },
        rcNumber: { type: String, trim: true, uppercase: true },
        capacityKg: { type: Number, min: 0 },
        ratePerKm: { type: Number, min: 0 },
        status: { type: String, trim: true },
    },
    charges: {
        transportationCharge: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
    },
    status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
}, { timestamps: true });
exports.B2bInvoice = (0, mongoose_1.model)('B2bInvoice', b2bInvoiceSchema);
