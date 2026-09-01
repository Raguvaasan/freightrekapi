"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelSettlement = exports.SETTLEMENT_STATUSES = void 0;
const mongoose_1 = require("mongoose");
exports.SETTLEMENT_STATUSES = ['settled', 'reversed'];
const adjustmentSchema = new mongoose_1.Schema({
    previousOrderAmount: { type: Number, required: true },
    newOrderAmount: { type: Number, required: true },
    deltaAdminShare: { type: Number, required: true },
    agencyTransactionId: { type: String },
    adminTransactionId: { type: String },
    adjustedBy: { type: String },
    adjustedByRole: { type: String },
    note: { type: String, trim: true },
    adjustedAt: { type: Date, default: Date.now },
}, { _id: false });
const parcelSettlementSchema = new mongoose_1.Schema({
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
    orderAmount: {
        type: Number,
        required: true,
        min: [0, 'Order amount cannot be negative'],
    },
    profitPercentage: {
        type: Number,
        required: true,
        min: [0, 'Profit percentage cannot be negative'],
        max: [100, 'Profit percentage cannot exceed 100'],
    },
    agencyProfitAmount: {
        type: Number,
        required: true,
        min: [0, 'Agency profit cannot be negative'],
    },
    adminShareAmount: {
        type: Number,
        required: true,
        min: [0, 'Admin share cannot be negative'],
    },
    walletDebitAmount: {
        type: Number,
        min: [0, 'Wallet debit amount cannot be negative'],
    },
    status: {
        type: String,
        enum: exports.SETTLEMENT_STATUSES,
        default: 'settled',
    },
    agencyDebitTransactionId: { type: String },
    adminCreditTransactionId: { type: String },
    adjustments: {
        type: [adjustmentSchema],
        default: [],
    },
    settledAt: { type: Date, default: Date.now },
    settledBy: { type: String },
    settledByRole: { type: String },
    reversedAt: { type: Date },
    reversedBy: { type: String },
    reversalReason: { type: String, trim: true },
    agencyRefundTransactionId: { type: String },
    adminReversalTransactionId: { type: String },
    notes: { type: String, trim: true },
}, { timestamps: true });
parcelSettlementSchema.index({ agency: 1, createdAt: -1 });
parcelSettlementSchema.index({ status: 1 });
parcelSettlementSchema.index({ orderNumber: 1 });
exports.ParcelSettlement = (0, mongoose_1.model)('ParcelSettlement', parcelSettlementSchema);
