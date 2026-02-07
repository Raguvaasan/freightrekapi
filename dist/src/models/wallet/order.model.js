"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    orderId: {
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
    amount: {
        type: Number,
        required: true,
        min: 1, // Minimum ₹1
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'netbanking', 'wallet'],
        required: true,
    },
    type: {
        type: String,
        default: 'wallet_recharge',
    },
    sessionId: {
        type: String,
    },
    paymentId: {
        type: String,
    },
    cashfreeOrderId: {
        type: String,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    completedAt: {
        type: Date,
    },
    failedAt: {
        type: Date,
    },
}, { timestamps: true });
// Create compound index for user queries
orderSchema.index({ userId: 1, createdAt: -1 });
exports.Order = (0, mongoose_1.model)('Order', orderSchema);
