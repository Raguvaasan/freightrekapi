"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agencyService = exports.AgencyService = void 0;
const agency_model_1 = require("../../models/admin/agency.model");
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
const otp_model_1 = require("../../models/customer/otp.model");
const axios_1 = __importDefault(require("axios"));
const phoneCheck_1 = require("../../utils/phoneCheck");
class AgencyService {
    // Franchise Login
    async loginFranchise(username, password) {
        try {
            // Find agency by username
            const agency = await agency_model_1.Agency.findOne({ username }).select('+password');
            if (!agency) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }
            // Check if agency has password set
            if (!agency.password) {
                return {
                    success: false,
                    message: 'Login credentials not configured for this franchise',
                };
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, agency.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                };
            }
            // Check if franchise is active
            if (agency.status !== 'Active') {
                return {
                    success: false,
                    message: 'Franchise account is inactive',
                };
            }
            // Remove password from response
            const agencyData = agency.toObject();
            delete agencyData.password;
            // Generate JWT token for franchise user
            const token = (0, jwt_1.generateToken)(agency._id.toString());
            return {
                success: true,
                message: 'Login successful',
                data: agencyData,
                token: token,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error during login',
            };
        }
    }
    // Create new agency
    async createAgency(data) {
        try {
            // Check phone global uniqueness
            const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(data.phone);
            if (phoneError) {
                return { success: false, message: phoneError };
            }
            // Check if agency with same name already exists
            const existingAgency = await agency_model_1.Agency.findOne({
                agencyName: data.agencyName
            });
            if (existingAgency) {
                return {
                    success: false,
                    message: 'Agency with this name already exists',
                };
            }
            // Check if username already exists (if provided)
            if (data.username) {
                const existingUsername = await agency_model_1.Agency.findOne({
                    username: data.username
                });
                if (existingUsername) {
                    return {
                        success: false,
                        message: 'Username already exists',
                    };
                }
            }
            // Hash password if provided
            let agencyData = { ...data };
            if (data.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                agencyData.password = await bcryptjs_1.default.hash(data.password, salt);
            }
            const agency = new agency_model_1.Agency(agencyData);
            await agency.save();
            const populatedAgency = await agency_model_1.Agency.findById(agency._id);
            return {
                success: true,
                message: 'Agency created successfully',
                data: populatedAgency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating agency',
            };
        }
    }
    // Get all agencies with pagination and search
    async getAllAgencies(page = 1, limit = 10, search, status) {
        try {
            const skip = (page - 1) * limit;
            const query = {};
            // Search filter
            if (search) {
                query.$or = [
                    { agencyName: { $regex: search, $options: 'i' } },
                    { agencyOwner: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { city: { $regex: search, $options: 'i' } },
                    { state: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                ];
            }
            // Status filter
            if (status) {
                query.status = status;
            }
            const agencies = await agency_model_1.Agency.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            const total = await agency_model_1.Agency.countDocuments(query);
            return {
                success: true,
                data: {
                    agencies,
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
                message: error.message || 'Error fetching agencies',
            };
        }
    }
    // Get agency by ID
    async getAgencyById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findById(id);
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            return {
                success: true,
                data: agency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching agency',
            };
        }
    }
    // Update agency
    async updateAgency(id, data) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findById(id);
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            // Check if updating name and if new name already exists
            if (data.agencyName && data.agencyName !== agency.agencyName) {
                const existingAgency = await agency_model_1.Agency.findOne({
                    agencyName: data.agencyName,
                    _id: { $ne: id },
                });
                if (existingAgency) {
                    return {
                        success: false,
                        message: 'Agency with this name already exists',
                    };
                }
            }
            // Check if updating username and if new username already exists
            if (data.username && data.username !== agency.username) {
                const existingUsername = await agency_model_1.Agency.findOne({
                    username: data.username,
                    _id: { $ne: id },
                });
                if (existingUsername) {
                    return {
                        success: false,
                        message: 'Username already exists',
                    };
                }
            }
            // Check phone global uniqueness if updating phone
            if (data.phone && data.phone !== agency.phone) {
                const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(data.phone, { model: 'Agency', id });
                if (phoneError) {
                    return { success: false, message: phoneError };
                }
            }
            // Hash password if being updated
            let updateData = { ...data };
            if (data.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                updateData.password = await bcryptjs_1.default.hash(data.password, salt);
            }
            // Update fields
            Object.keys(updateData).forEach((key) => {
                if (updateData[key] !== undefined) {
                    agency[key] = updateData[key];
                }
            });
            await agency.save();
            const updatedAgency = await agency_model_1.Agency.findById(id);
            return {
                success: true,
                message: 'Agency updated successfully',
                data: updatedAgency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating agency',
            };
        }
    }
    // Delete agency
    async deleteAgency(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findById(id);
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            await agency_model_1.Agency.findByIdAndDelete(id);
            return {
                success: true,
                message: 'Agency deleted successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting agency',
            };
        }
    }
    // Update agency status
    async updateAgencyStatus(id, status) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return {
                    success: false,
                    message: 'Invalid agency ID',
                };
            }
            const agency = await agency_model_1.Agency.findByIdAndUpdate(id, { status }, { new: true });
            if (!agency) {
                return {
                    success: false,
                    message: 'Agency not found',
                };
            }
            return {
                success: true,
                message: 'Agency status updated successfully',
                data: agency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating agency status',
            };
        }
    }
    // OTP Login - Send OTP
    async sendLoginOtp(phone, countryCode) {
        try {
            const agency = await agency_model_1.Agency.findOne({ phone, status: 'Active' }).lean();
            if (!agency) {
                return { success: false, message: 'No active franchise account found with this phone number' };
            }
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await otp_model_1.Otp.deleteMany({ phone, userType: 'franchise' });
            await otp_model_1.Otp.create({ phone, countryCode, otp, expiresAt, userType: 'franchise' });
            const apiKey = process.env.PING4SMS_API_KEY;
            const sender = process.env.PING4SMS_SENDER;
            const templateId = process.env.PING4SMS_TEMPLATE_ID;
            const route = process.env.PING4SMS_ROUTE || '2';
            const fullPhone = `${countryCode.replace('+', '')}${phone}`;
            const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
            const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
            console.log('[Ping4SMS] Franchise OTP URL:', url);
            const smsResponse = await axios_1.default.get(url);
            console.log('[Ping4SMS] Franchise OTP Response:', JSON.stringify(smsResponse.data));
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
            const record = await otp_model_1.Otp.findOne({ phone, used: false, userType: 'franchise' }).lean();
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
            const agency = await agency_model_1.Agency.findOne({ phone, status: 'Active' }).lean();
            if (!agency) {
                return { success: false, message: 'No active franchise account found with this phone number' };
            }
            const token = (0, jwt_1.generateToken)(agency._id.toString());
            return {
                success: true,
                message: 'Login successful',
                token,
                data: {
                    id: agency._id,
                    agencyName: agency.agencyName,
                    agencyOwner: agency.agencyOwner,
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
}
exports.AgencyService = AgencyService;
exports.agencyService = new AgencyService();
