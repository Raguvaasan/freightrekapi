"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bOtp = void 0;
const mongoose_1 = require("mongoose");
const b2bOtpSchema = new mongoose_1.Schema({
    mobileNumber: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false },
});
b2bOtpSchema.index({ mobileNumber: 1, used: 1 });
b2bOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.B2bOtp = (0, mongoose_1.model)('B2bOtp', b2bOtpSchema);
