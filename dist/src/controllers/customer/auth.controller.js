"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.sendOtp = exports.register = void 0;
const customerAuth_service_1 = require("../../services/customerAuth.service");
const register = async (req, res) => {
    try {
        const result = await customerAuth_service_1.customerAuthService.register(req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.register = register;
const sendOtp = async (req, res) => {
    try {
        const { phone, countryCode } = req.body;
        const result = await customerAuth_service_1.customerAuthService.sendOtp(phone, countryCode);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res) => {
    try {
        const { phone, countryCode, otp } = req.body;
        const result = await customerAuth_service_1.customerAuthService.verifyOtp(phone, countryCode, otp);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.verifyOtp = verifyOtp;
