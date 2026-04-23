"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = void 0;
const mongoose_1 = require("mongoose");
const otpSchema = new mongoose_1.Schema({
    phone: { type: String, required: true },
    countryCode: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    userType: { type: String, enum: ['customer', 'franchise', 'staff'], default: 'customer' },
});
// Fast lookup for OTP verification (every login/register hits this)
otpSchema.index({ phone: 1, countryCode: 1, used: 1, userType: 1 });
// Auto-delete document from MongoDB after it expires
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Otp = (0, mongoose_1.model)('Otp', otpSchema);
