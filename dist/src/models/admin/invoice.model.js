"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = exports.INVOICE_STATUSES = void 0;
const mongoose_1 = require("mongoose");
const parcelOrder_model_1 = require("./parcelOrder.model");
exports.INVOICE_STATUSES = ['issued', 'cancelled'];
const partySchema = new mongoose_1.Schema({
    name: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    agencyName: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
}, { _id: false });
const chargesSchema = new mongoose_1.Schema({
    transportationCharge: { type: Number, required: true, min: 0 },
    loadingChargePercentage: { type: Number, default: 0, min: 0 },
    loadingCharge: { type: Number, default: 0, min: 0 },
    miscChargePercentage: { type: Number, default: 0, min: 0 },
    miscellaneousCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
}, { _id: false });
const revisionSchema = new mongoose_1.Schema({
    previousTotal: { type: Number, required: true },
    newTotal: { type: Number, required: true },
    revisedBy: { type: String },
    note: { type: String, trim: true },
    revisedAt: { type: Date, default: Date.now },
}, { _id: false });
const invoiceSchema = new mongoose_1.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    order: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ParcelOrder',
        required: true,
        unique: true,
    },
    orderNumber: {
        type: String,
        required: true,
        trim: true,
    },
    agency: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agency',
        required: true,
    },
    deliveryAgency: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agency',
    },
    invoiceDate: { type: Date, default: Date.now },
    issuedByAgency: { type: partySchema, default: () => ({}) },
    billTo: { type: partySchema, default: () => ({}) },
    shipTo: { type: partySchema, default: () => ({}) },
    pickupAddress: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    parcelDetails: {
        article: { type: String, trim: true },
        remarks: { type: String, trim: true },
        numberOfParcels: { type: Number, min: 0 },
        approximateValue: { type: Number, min: 0 },
    },
    waybill: { type: String, trim: true, uppercase: true },
    vehicleType: { type: String, trim: true },
    vehicleCapacity: { type: String, trim: true },
    charges: { type: chargesSchema, required: true },
    paymentType: { type: String, enum: parcelOrder_model_1.PAYMENT_TYPES, required: true },
    status: {
        type: String,
        enum: exports.INVOICE_STATUSES,
        default: 'issued',
    },
    notes: { type: String, trim: true },
    revisions: { type: [revisionSchema], default: [] },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancelReason: { type: String, trim: true },
}, { timestamps: true });
invoiceSchema.index({ agency: 1, invoiceDate: -1 });
invoiceSchema.index({ deliveryAgency: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ orderNumber: 1 });
invoiceSchema.index({ invoiceDate: -1 });
exports.Invoice = (0, mongoose_1.model)('Invoice', invoiceSchema);
