"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyB2bOtp = exports.sendB2bOtp = void 0;
const auth_service_1 = require("../../services/b2b/auth.service");
const staff_service_1 = require("../../services/admin/staff.service");
const b2bUser_model_1 = require("../../models/b2b/b2bUser.model");
const normalizeMobile = (value) => String(value || '').replace(/\D/g, '').slice(-10);
const sendB2bOtp = async (req, res) => {
    const rawMobileNumber = req.body.mobileNumber || req.body.phone;
    const mobileNumber = normalizeMobile(rawMobileNumber);
    const countryCode = req.body.countryCode || '+91';
    const b2bUser = mobileNumber ? await b2bUser_model_1.B2bUser.findOne({ mobileNumber, status: 'Active' }) : null;
    if (!b2bUser && !req.body.mobileNumber) {
        const { phone, countryCode } = req.body;
        const result = await staff_service_1.staffService.sendB2bOtp(phone, countryCode);
        return res.status(result.success ? 200 : 400).json(result);
    }
    const result = await auth_service_1.b2bAuthService.sendOtp(String(mobileNumber), String(countryCode));
    return res.status(result.success ? 200 : 400).json(result);
};
exports.sendB2bOtp = sendB2bOtp;
const verifyB2bOtp = async (req, res) => {
    const rawMobileNumber = req.body.mobileNumber || req.body.phone;
    const mobileNumber = normalizeMobile(rawMobileNumber);
    const b2bUser = mobileNumber ? await b2bUser_model_1.B2bUser.findOne({ mobileNumber, status: 'Active' }) : null;
    if (!b2bUser && !req.body.mobileNumber) {
        const { phone, countryCode, otp } = req.body;
        const result = await staff_service_1.staffService.verifyB2bOtp(phone, countryCode, otp);
        return res.status(result.success ? 200 : 401).json(result);
    }
    const result = await auth_service_1.b2bAuthService.verifyOtp(String(mobileNumber), req.body.otp);
    return res.status(result.success ? 200 : 401).json(result);
};
exports.verifyB2bOtp = verifyB2bOtp;
