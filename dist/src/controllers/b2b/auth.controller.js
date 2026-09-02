"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyB2bOtp = exports.sendB2bOtp = void 0;
const auth_service_1 = require("../../services/b2b/auth.service");
const sendB2bOtp = async (req, res) => {
    const result = await auth_service_1.b2bAuthService.sendOtp(req.body.mobileNumber);
    return res.status(result.success ? 200 : 400).json(result);
};
exports.sendB2bOtp = sendB2bOtp;
const verifyB2bOtp = async (req, res) => {
    const result = await auth_service_1.b2bAuthService.verifyOtp(req.body.mobileNumber, req.body.otp);
    return res.status(result.success ? 200 : 401).json(result);
};
exports.verifyB2bOtp = verifyB2bOtp;
