"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyPayout = exports.PAYOUT_STATUSES = void 0;
const mongoose_1 = require("mongoose");
exports.PAYOUT_STATUSES = ['paid', 'reversed'];
const agencyPayoutSchema = new mongoose_1.Schema({
    agency: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agency',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Payout amount must be greater than 0'],
    },
    paymentMethod: { type: String, trim: true },
    reference: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: {
        type: String,
        enum: exports.PAYOUT_STATUSES,
        default: 'paid',
    },
    // Snapshotted so a statement row still explains itself after later bookings
    // have moved the totals on
    profitAtPayment: { type: Number, default: 0 },
    paidBeforeThis: { type: Number, default: 0 },
    paidAt: { type: Date, default: Date.now },
    paidBy: { type: String },
    paidByName: { type: String, trim: true },
    reversedAt: { type: Date },
    reversedBy: { type: String },
    reversalReason: { type: String, trim: true },
}, { timestamps: true });
agencyPayoutSchema.index({ agency: 1, paidAt: -1 });
agencyPayoutSchema.index({ status: 1 });
exports.AgencyPayout = (0, mongoose_1.model)('AgencyPayout', agencyPayoutSchema);
