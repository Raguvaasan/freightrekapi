"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionAgencyService = exports.CollectionAgencyService = void 0;
const collectionAgency_model_1 = require("../../models/admin/collectionAgency.model");
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const phoneCheck_1 = require("../../utils/phoneCheck");
const jwt_1 = require("../../utils/jwt");
const otp_model_1 = require("../../models/customer/otp.model");
class CollectionAgencyService {
    // OTP Login - Send OTP
    async sendLoginOtp(phone, countryCode) {
        try {
            const agency = await collectionAgency_model_1.CollectionAgency.findOne({ phone, status: 'Active' }).lean();
            if (!agency) {
                return { success: false, message: 'No active collection agency account found with this phone number' };
            }
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await otp_model_1.Otp.deleteMany({ phone, userType: 'collection_agency' });
            await otp_model_1.Otp.create({ phone, countryCode, otp, expiresAt, userType: 'collection_agency' });
            const apiKey = process.env.PING4SMS_API_KEY;
            const sender = process.env.PING4SMS_SENDER;
            const templateId = process.env.PING4SMS_TEMPLATE_ID;
            const route = process.env.PING4SMS_ROUTE || '2';
            const fullPhone = `${countryCode.replace('+', '')}${phone}`;
            const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
            const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
            console.log('[Ping4SMS] Collection Agency OTP URL:', url);
            const smsResponse = await axios_1.default.get(url, { timeout: 10000 });
            console.log('[Ping4SMS] Collection Agency OTP Response:', JSON.stringify(smsResponse.data));
            const responseStr = typeof smsResponse.data === 'string' ? smsResponse.data : JSON.stringify(smsResponse.data);
            if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
                return { success: false, message: `SMS sending failed: ${responseStr}` };
            }
            return { success: true, message: 'OTP sent successfully' };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error sending OTP' };
        }
    }
    // OTP Login - Verify OTP
    async verifyLoginOtp(phone, countryCode, otp) {
        try {
            const record = await otp_model_1.Otp.findOne({ phone, used: false, userType: 'collection_agency' }).lean();
            if (!record) {
                return { success: false, message: 'OTP not found. Please request a new one' };
            }
            if (new Date() > record.expiresAt) {
                await otp_model_1.Otp.deleteOne({ _id: record._id });
                return { success: false, message: 'OTP has expired. Please request a new one' };
            }
            if (record.otp !== otp) {
                return { success: false, message: 'Invalid OTP' };
            }
            await otp_model_1.Otp.updateOne({ _id: record._id }, { used: true });
            const agency = await collectionAgency_model_1.CollectionAgency.findOne({ phone, status: 'Active' }).lean();
            if (!agency) {
                return { success: false, message: 'No active collection agency account found with this phone number' };
            }
            const token = (0, jwt_1.generateToken)(agency._id.toString());
            return {
                success: true,
                message: 'Login successful',
                token,
                data: {
                    id: agency._id,
                    collectionAgencyName: agency.collectionAgencyName,
                    ownerName: agency.ownerName,
                    phone: agency.phone,
                    email: agency.email,
                    status: agency.status,
                    address: agency.address,
                    city: agency.city,
                    state: agency.state,
                    pincode: agency.pincode,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error verifying OTP' };
        }
    }
    // Create new collection agency
    async createCollectionAgency(data) {
        try {
            // Check phone global uniqueness
            const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(data.phone);
            if (phoneError) {
                return { success: false, message: phoneError };
            }
            // Check if collection agency with same name already exists
            const existing = await collectionAgency_model_1.CollectionAgency.findOne({
                collectionAgencyName: data.collectionAgencyName,
            });
            if (existing) {
                return {
                    success: false,
                    message: 'Collection agency with this name already exists',
                };
            }
            // Check if username already exists (if provided)
            if (data.username) {
                const existingUsername = await collectionAgency_model_1.CollectionAgency.findOne({
                    username: data.username,
                });
                if (existingUsername) {
                    return {
                        success: false,
                        message: 'Username already exists',
                    };
                }
            }
            // Hash password if provided
            const agencyData = { ...data };
            if (data.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                agencyData.password = await bcryptjs_1.default.hash(data.password, salt);
            }
            const agency = new collectionAgency_model_1.CollectionAgency(agencyData);
            await agency.save();
            const created = await collectionAgency_model_1.CollectionAgency.findById(agency._id);
            return {
                success: true,
                message: 'Collection agency created successfully',
                data: created,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating collection agency',
            };
        }
    }
    // Get all collection agencies with pagination and search
    async getAllCollectionAgencies(page = 1, limit = 10, search, status) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            if (search) {
                query.$or = [
                    { collectionAgencyName: { $regex: search, $options: 'i' } },
                    { ownerName: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { city: { $regex: search, $options: 'i' } },
                    { state: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                ];
            }
            if (status) {
                query.status = status;
            }
            const agencies = await collectionAgency_model_1.CollectionAgency.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await collectionAgency_model_1.CollectionAgency.countDocuments(query);
            return {
                success: true,
                data: {
                    collectionAgencies: agencies,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching collection agencies',
            };
        }
    }
    // Get collection agency by ID
    async getCollectionAgencyById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid collection agency ID' };
            }
            const agency = await collectionAgency_model_1.CollectionAgency.findById(id);
            if (!agency) {
                return { success: false, message: 'Collection agency not found' };
            }
            return { success: true, data: agency };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching collection agency',
            };
        }
    }
    // Update collection agency
    async updateCollectionAgency(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid collection agency ID' };
            }
            const agency = await collectionAgency_model_1.CollectionAgency.findById(id);
            if (!agency) {
                return { success: false, message: 'Collection agency not found' };
            }
            // Check if updating name and if new name already exists
            if (data.collectionAgencyName &&
                data.collectionAgencyName !== agency.collectionAgencyName) {
                const existing = await collectionAgency_model_1.CollectionAgency.findOne({
                    collectionAgencyName: data.collectionAgencyName,
                    _id: { $ne: id },
                });
                if (existing) {
                    return {
                        success: false,
                        message: 'Collection agency with this name already exists',
                    };
                }
            }
            // Check if updating username and if new username already exists
            if (data.username && data.username !== agency.username) {
                const existingUsername = await collectionAgency_model_1.CollectionAgency.findOne({
                    username: data.username,
                    _id: { $ne: id },
                });
                if (existingUsername) {
                    return { success: false, message: 'Username already exists' };
                }
            }
            // Check phone global uniqueness if updating phone
            if (data.phone && data.phone !== agency.phone) {
                const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(data.phone, {
                    model: 'CollectionAgency',
                    id,
                });
                if (phoneError) {
                    return { success: false, message: phoneError };
                }
            }
            // Hash password if being updated
            const updateData = { ...data };
            if (data.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                updateData.password = await bcryptjs_1.default.hash(data.password, salt);
            }
            Object.keys(updateData).forEach((key) => {
                if (updateData[key] !== undefined) {
                    agency[key] = updateData[key];
                }
            });
            await agency.save();
            const updated = await collectionAgency_model_1.CollectionAgency.findById(id);
            return {
                success: true,
                message: 'Collection agency updated successfully',
                data: updated,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating collection agency',
            };
        }
    }
    // Delete collection agency
    async deleteCollectionAgency(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid collection agency ID' };
            }
            const agency = await collectionAgency_model_1.CollectionAgency.findById(id);
            if (!agency) {
                return { success: false, message: 'Collection agency not found' };
            }
            await collectionAgency_model_1.CollectionAgency.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Collection agency deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting collection agency',
            };
        }
    }
    // Update collection agency status
    async updateCollectionAgencyStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid collection agency ID' };
            }
            const agency = await collectionAgency_model_1.CollectionAgency.findByIdAndUpdate(id, { status }, { new: true });
            if (!agency) {
                return { success: false, message: 'Collection agency not found' };
            }
            return {
                success: true,
                message: 'Collection agency status updated successfully',
                data: agency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating collection agency status',
            };
        }
    }
}
exports.CollectionAgencyService = CollectionAgencyService;
exports.collectionAgencyService = new CollectionAgencyService();
