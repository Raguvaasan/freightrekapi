"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    orderId: {
        type: String,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['credit', 'debit', 'refund', 'reversal'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed',
    },
    description: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
    },
    paymentId: {
        type: String,
    },
    balanceBefore: {
        type: Number,
        required: true,
    },
    balanceAfter: {
        type: Number,
        required: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { timestamps: true });
// Create compound index for user transaction history
transactionSchema.index({ userId: 1, createdAt: -1 });
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
