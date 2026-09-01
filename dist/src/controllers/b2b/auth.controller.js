"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyB2bOtp = exports.sendB2bOtp = void 0;
const staff_service_1 = require("../../services/admin/staff.service");
const sendB2bOtp = async (req, res) => {
    try {
        const { phone, countryCode } = req.body;
        const result = await staff_service_1.staffService.sendB2bOtp(phone, countryCode);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.sendB2bOtp = sendB2bOtp;
const verifyB2bOtp = async (req, res) => {
    try {
        const { phone, countryCode, otp } = req.body;
        const result = await staff_service_1.staffService.verifyB2bOtp(phone, countryCode, otp);
        if (!result.success) {
            return res.status(401).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.verifyB2bOtp = verifyB2bOtp;
