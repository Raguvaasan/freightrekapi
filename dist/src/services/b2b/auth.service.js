"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.b2bAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const b2bOtp_model_1 = require("../../models/b2b/b2bOtp.model");
const b2bUser_model_1 = require("../../models/b2b/b2bUser.model");
const jwt_1 = require("../../utils/jwt");
const sendSms = async (mobileNumber, otp) => {
    const apiKey = process.env.PING4SMS_API_KEY;
    const sender = process.env.PING4SMS_SENDER;
    const templateId = process.env.PING4SMS_TEMPLATE_ID;
    const route = process.env.PING4SMS_ROUTE || '2';
    const fullPhone = `91${mobileNumber.replace(/^\\+/, '')}`;
    const message = `Your B2B OTP is ${otp}. Do not share it with anyone. - FREIGHTREK`;
    const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
    const response = await axios_1.default.get(url, { timeout: 10000 });
    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    if (body.includes('-1') || body.includes('-2') || body.toLowerCase().includes('error') || body.includes('INVALID')) {
        throw new Error(`SMS sending failed: ${body}`);
    }
};
exports.b2bAuthService = {
    async register(input) {
        const existing = await b2bUser_model_1.B2bUser.findOne({ mobileNumber: input.mobileNumber });
        if (existing)
            return { success: false, message: 'B2B user already exists' };
        const user = await b2bUser_model_1.B2bUser.create(input);
        return { success: true, message: 'B2B registered successfully', data: user };
    },
    async sendOtp(mobileNumber) {
        const user = await b2bUser_model_1.B2bUser.findOne({ mobileNumber, status: 'Active' });
        if (!user)
            return { success: false, message: 'No active B2B user found with this mobile number' };
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await b2bOtp_model_1.B2bOtp.deleteMany({ mobileNumber });
        await b2bOtp_model_1.B2bOtp.create({ mobileNumber, otp, expiresAt });
        await sendSms(mobileNumber, otp);
        return { success: true, message: 'OTP sent successfully' };
    },
    async verifyOtp(mobileNumber, otp) {
        const record = await b2bOtp_model_1.B2bOtp.findOne({ mobileNumber, used: false }).sort({ createdAt: -1 });
        if (!record)
            return { success: false, message: 'OTP not found. Please request a new one' };
        if (new Date() > record.expiresAt)
            return { success: false, message: 'OTP has expired. Please request a new one' };
        if (record.otp !== otp)
            return { success: false, message: 'Invalid OTP' };
        await b2bOtp_model_1.B2bOtp.updateOne({ _id: record._id }, { used: true });
        const user = await b2bUser_model_1.B2bUser.findOne({ mobileNumber, status: 'Active' });
        if (!user)
            return { success: false, message: 'No active B2B user found' };
        const token = (0, jwt_1.generateToken)(user._id.toString());
        return { success: true, message: 'Login successful', data: { token, user } };
    },
};
