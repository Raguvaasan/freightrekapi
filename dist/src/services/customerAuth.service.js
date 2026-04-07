"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const appCustomer_model_1 = require("../models/customer/appCustomer.model");
const customer_model_1 = require("../models/customer/customer.model");
const otp_model_1 = require("../models/customer/otp.model");
const jwt_1 = require("../utils/jwt");
exports.customerAuthService = {
    async register(input) {
        const { firstName, lastName, email, phone, countryCode } = input;
        // Block if an active account already exists with same email or phone
        const existingEmail = await appCustomer_model_1.AppCustomer.findOne({ email, status: 'Active' });
        if (existingEmail) {
            return { success: false, message: 'An account with this email already exists. Please login' };
        }
        const existingPhone = await appCustomer_model_1.AppCustomer.findOne({ phone, countryCode, status: 'Active' });
        if (existingPhone) {
            return { success: false, message: 'An account with this phone number already exists. Please login' };
        }
        // Remove any stale pending registrations for same phone/email
        await appCustomer_model_1.AppCustomer.deleteMany({
            $or: [{ email }, { phone, countryCode }],
            status: 'Pending',
        });
        // Create customer as Pending (activated after OTP verification)
        await appCustomer_model_1.AppCustomer.create({
            firstName,
            lastName,
            email,
            phone,
            countryCode,
            status: 'Pending',
        });
        // Generate and save OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await otp_model_1.Otp.deleteMany({ phone });
        await otp_model_1.Otp.create({ phone, countryCode, otp, expiresAt });
        // Send SMS via Ping4SMS
        const apiKey = process.env.PING4SMS_API_KEY;
        const sender = process.env.PING4SMS_SENDER;
        const templateId = process.env.PING4SMS_TEMPLATE_ID;
        const route = process.env.PING4SMS_ROUTE || '2';
        const fullPhone = `${countryCode.replace('+', '')}${phone}`;
        const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
        const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
        console.log('[Ping4SMS] URL:', url);
        const smsResponse = await axios_1.default.get(url);
        console.log('[Ping4SMS] Response:', JSON.stringify(smsResponse.data));
        const responseData = smsResponse.data;
        const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
        if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
            console.error('[Ping4SMS] SMS failed:', responseStr);
            // Rollback pending customer creation on SMS failure
            await appCustomer_model_1.AppCustomer.deleteMany({ phone, countryCode, status: 'Pending' });
            return { success: false, message: `SMS sending failed: ${responseStr}` };
        }
        return {
            success: true,
            message: 'OTP sent to your phone. Please verify to complete registration',
        };
    },
    async sendOtp(phone, countryCode) {
        // Only Active accounts can use login OTP; Pending accounts must use /register flow
        const customer = await appCustomer_model_1.AppCustomer.findOne({ phone, status: 'Active' });
        if (!customer) {
            return { success: false, message: 'No active account found with this phone number. Please register first' };
        }
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        // Delete any existing OTPs for this phone
        await otp_model_1.Otp.deleteMany({ phone });
        // Save new OTP (use countryCode from customer record)
        await otp_model_1.Otp.create({ phone, countryCode: customer.countryCode, otp, expiresAt });
        // Send SMS via Ping4SMS
        const apiKey = process.env.PING4SMS_API_KEY;
        const sender = process.env.PING4SMS_SENDER;
        const templateId = process.env.PING4SMS_TEMPLATE_ID;
        const route = process.env.PING4SMS_ROUTE || '2';
        // countryCode includes '+', remove it for the number
        const fullPhone = `${countryCode.replace('+', '')}${phone}`;
        const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
        const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
        console.log('[Ping4SMS] URL:', url);
        const smsResponse = await axios_1.default.get(url);
        console.log('[Ping4SMS] Response:', JSON.stringify(smsResponse.data));
        // Ping4SMS returns error codes in the body (still HTTP 200)
        const responseData = smsResponse.data;
        const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
        // Ping4SMS error codes start with negative numbers e.g. -1, -2, or contain "ERROR"
        if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
            console.error('[Ping4SMS] SMS failed:', responseStr);
            return { success: false, message: `SMS sending failed: ${responseStr}` };
        }
        return { success: true, message: 'OTP sent successfully' };
    },
    async verifyOtp(phone, countryCode, otp) {
        const record = await otp_model_1.Otp.findOne({ phone, used: false });
        if (!record) {
            return { success: false, message: 'OTP not found. Please request a new one' };
        }
        if (new Date() > record.expiresAt) {
            await record.deleteOne();
            return { success: false, message: 'OTP has expired. Please request a new one' };
        }
        if (record.otp !== otp) {
            return { success: false, message: 'Invalid OTP' };
        }
        // Mark OTP as used
        record.used = true;
        await record.save();
        // Find customer account (Pending = completing registration, Active = login)
        const customer = await appCustomer_model_1.AppCustomer.findOne({ phone });
        if (!customer) {
            return { success: false, message: 'No account found with this phone number. Please register first' };
        }
        let responseMessage = 'Login successful';
        if (customer.status === 'Pending') {
            // Complete registration: activate account and sync to admin customers collection
            customer.status = 'Active';
            await customer.save();
            const existingAdminCustomer = await customer_model_1.Customer.findOne({ email: customer.email });
            if (!existingAdminCustomer) {
                await customer_model_1.Customer.create({
                    name: `${customer.firstName} ${customer.lastName}`,
                    email: customer.email,
                    phone: customer.phone,
                    status: 'Active',
                });
            }
            responseMessage = 'Registration successful';
        }
        const token = (0, jwt_1.generateToken)(customer._id.toString());
        return {
            success: true,
            message: responseMessage,
            data: {
                token,
                customer: {
                    id: customer._id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    countryCode: customer.countryCode,
                    status: customer.status,
                },
            },
        };
    },
};
