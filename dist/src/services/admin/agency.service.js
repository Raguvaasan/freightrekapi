"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agencyService = exports.AgencyService = void 0;
const agency_model_1 = require("../../models/admin/agency.model");
const staff_model_1 = require("../../models/admin/staff.model");
const franchiseRole_model_1 = require("../../models/admin/franchiseRole.model");
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
const otp_model_1 = require("../../models/customer/otp.model");
const axios_1 = __importDefault(require("axios"));
const phoneCheck_1 = require("../../utils/phoneCheck");
// Picks the agency that the staff of `agencyBeingDeleted` should move to.
// Nearest first — same city, then same state — so staff stay with an agency
// they can realistically work out of; any other active agency is the last
// resort.
const findReassignmentAgency = async (agencyBeingDeleted, preferredAgencyId) => {
    if (preferredAgencyId) {
        if (!mongoose_1.Types.ObjectId.isValid(preferredAgencyId)) {
            return { error: 'Invalid reassignAgencyId' };
        }
        if (preferredAgencyId === agencyBeingDeleted._id.toString()) {
            return { error: 'reassignAgencyId cannot be the agency being deleted' };
        }
        const preferred = await agency_model_1.Agency.findById(preferredAgencyId);
        if (!preferred) {
            return { error: 'Agency to reassign staff to was not found' };
        }
        if (preferred.status !== 'Active') {
            return { error: 'Agency to reassign staff to is inactive' };
        }
        return { agency: preferred };
    }
    const exclude = { _id: { $ne: agencyBeingDeleted._id }, status: 'Active' };
    // city / state are optional on an agency, so only match on them when the
    // agency being deleted actually has one - otherwise every agency missing a
    // city would look like a match.
    const agency = (agencyBeingDeleted.city &&
        (await agency_model_1.Agency.findOne({ ...exclude, city: agencyBeingDeleted.city }).sort({ createdAt: 1 }))) ||
        (agencyBeingDeleted.state &&
            (await agency_model_1.Agency.findOne({ ...exclude, state: agencyBeingDeleted.state }).sort({ createdAt: 1 }))) ||
        (await agency_model_1.Agency.findOne(exclude).sort({ createdAt: 1 }));
    return agency ? { agency } : { error: null };
};
// Franchise-scoped roles don't travel with the staff — a FranchiseRole belongs
// to the agency it was created under. Match by name in the target agency when
// one exists, and otherwise drop the role so nobody keeps permissions granted
// by an agency that no longer exists.
const remapFranchiseRoles = async (staffList, targetAgencyId) => {
    for (const staff of staffList) {
        if (!staff.roleId)
            continue;
        const oldRole = await franchiseRole_model_1.FranchiseRole.findById(staff.roleId).lean();
        if (!oldRole)
            continue; // not a FranchiseRole (AdminRole etc.) - leave it alone
        const newRole = await franchiseRole_model_1.FranchiseRole.findOne({
            franchiseId: targetAgencyId,
            roleName: oldRole.roleName,
            status: true,
        }).lean();
        await staff_model_1.Staff.updateOne({ _id: staff._id }, newRole ? { $set: { roleId: newRole._id } } : { $unset: { roleId: '' } });
    }
};
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
    async getAllAgencies(page = 1, limit = 10, search, status, type) {
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
            // Ownership filter: Third Party / Own
            if (type) {
                query.type = type;
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
    async deleteAgency(id, reassignAgencyId) {
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
            const staffList = await staff_model_1.Staff.find({ type: 'franchise', franchiseId: agency._id });
            let reassignedTo = null;
            if (staffList.length) {
                const { agency: targetAgency, error } = await findReassignmentAgency(agency, reassignAgencyId);
                if (error) {
                    return { success: false, message: error };
                }
                // Deleting anyway would leave the staff pointing at an agency that no
                // longer exists - they vanish from the admin agency staff list while
                // still holding the phone / email / username uniqueness slots.
                if (!targetAgency) {
                    return {
                        success: false,
                        message: `Cannot delete agency: ${staffList.length} staff are assigned to it and there is no other active agency to move them to. Create another agency or remove the staff first.`,
                    };
                }
                await staff_model_1.Staff.updateMany({ type: 'franchise', franchiseId: agency._id }, { $set: { franchiseId: targetAgency._id } });
                await remapFranchiseRoles(staffList, targetAgency._id);
                reassignedTo = targetAgency;
            }
            await agency_model_1.Agency.findByIdAndDelete(id);
            await franchiseRole_model_1.FranchiseRole.deleteMany({ franchiseId: agency._id });
            return {
                success: true,
                message: reassignedTo
                    ? `Agency deleted successfully. ${staffList.length} staff reassigned to "${reassignedTo.agencyName}"`
                    : 'Agency deleted successfully',
                data: {
                    reassignedStaffCount: staffList.length,
                    reassignedToAgency: reassignedTo
                        ? {
                            _id: reassignedTo._id,
                            agencyName: reassignedTo.agencyName,
                            city: reassignedTo.city,
                        }
                        : null,
                },
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
    /**
     * Set the branch's profit percentage.
     *
     * It applies to bookings made from now on — settlements already recorded keep
     * the percentage they were booked under.
     */
    async updateProfitPercentage(id, profitPercentage, charges = {}) {
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
            // Commission only applies to a third-party agency
            if (agency.type === 'Own' && profitPercentage > 0) {
                return {
                    success: false,
                    message: `"${agency.agencyName}" is an Own agency, so no commission is applicable. Change its type to "Third Party" first.`,
                };
            }
            agency.profitPercentage = profitPercentage;
            // Loading and miscellaneous are set from the same screen; either may be
            // left out of the body to keep the value the agency already has.
            if (charges.loadingChargePercentage !== undefined) {
                agency.loadingChargePercentage = charges.loadingChargePercentage;
            }
            if (charges.miscChargePercentage !== undefined) {
                agency.miscChargePercentage = charges.miscChargePercentage;
            }
            await agency.save();
            return {
                success: true,
                message: `Commission set to ${profitPercentage}% for "${agency.agencyName}" ` +
                    `(loading ${agency.loadingChargePercentage}%, miscellaneous ` +
                    `${agency.miscChargePercentage}%). Applies to new bookings.`,
                data: agency,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating profit percentage',
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
            // Timeout so a stalled SMS gateway can't hold the request until the
            // serverless function is killed (a killed function returns no CORS
            // headers, which the browser reports as a failed/CORS request)
            const smsResponse = await axios_1.default.get(url, { timeout: 10000 });
            console.log('[Ping4SMS] Franchise OTP Response:', JSON.stringify(smsResponse.data));
            const responseStr = typeof smsResponse.data === 'string' ? smsResponse.data : JSON.stringify(smsResponse.data);
            if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
                return { success: false, message: `SMS sending failed: ${responseStr}` };
            }
            return { success: true, message: 'OTP sent successfully' };
        }
        catch (error) {
            console.error('[Ping4SMS] Franchise OTP send failed:', {
                code: error?.code,
                status: error?.response?.status,
                message: error?.message,
            });
            // A timeout/refusal here means the SMS gateway was unreachable from the
            // server, not a problem with the caller's input — don't leak the raw
            // axios message to the login screen
            const isNetworkFailure = error?.code === 'ECONNABORTED' ||
                error?.code === 'ETIMEDOUT' ||
                error?.code === 'ECONNREFUSED' ||
                error?.code === 'ENOTFOUND' ||
                /timeout/i.test(error?.message || '');
            return {
                success: false,
                message: isNetworkFailure
                    ? 'Unable to reach the SMS service right now. Please try again in a moment.'
                    : error.message || 'Error sending OTP',
            };
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
                    // Ownership of the agency: `type` is the stored wording, `agencyType`
                    // the boolean the agency form uses. Both are returned so the module
                    // the login lands on can branch on either.
                    type: agency.type,
                    agencyType: agency.type === 'Own',
                    status: agency.status,
                    address: agency.address,
                    city: agency.city,
                    state: agency.state,
                    pincode: agency.pincode,
                    profitPercentage: agency.profitPercentage,
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
