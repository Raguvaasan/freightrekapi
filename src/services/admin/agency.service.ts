import { Agency, IAgency } from '../../models/admin/agency.model';
import { Staff } from '../../models/admin/staff.model';
import { FranchiseRole } from '../../models/admin/franchiseRole.model';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';
import { Otp } from '../../models/customer/otp.model';
import axios from 'axios';
import { checkPhoneGloballyUnique } from '../../utils/phoneCheck';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  token?: string;
}

interface CreateAgencyInput {
  agencyName: string;
  agencyOwner: string;
  phone: string;
  status?: 'Active' | 'Inactive';
  /** Ownership as a boolean: true = Own, false = Third Party (mirrors `type`) */
  agencyType?: boolean;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  username?: string;
  password?: string;
  /** Ownership: Third Party (commission applies) or Own (no commission) */
  type?: 'Third Party' | 'Own';
  /** Commission: share of every booking total this agency keeps (0-100) */
  profitPercentage?: number;
  // The loading and miscellaneous charge percentages are not set here — a new
  // agency starts on the model defaults and both are changed from the wallet
  // screen (updateProfitPercentage).
}

interface UpdateAgencyInput {
  agencyName?: string;
  agencyOwner?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  /** Ownership as a boolean: true = Own, false = Third Party (mirrors `type`) */
  agencyType?: boolean;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  username?: string;
  password?: string;
  type?: 'Third Party' | 'Own';
  profitPercentage?: number;
  // See CreateAgencyInput: both charge percentages live on updateProfitPercentage
}

// Picks the agency that the staff of `agencyBeingDeleted` should move to.
// Nearest first — same city, then same state — so staff stay with an agency
// they can realistically work out of; any other active agency is the last
// resort.
const findReassignmentAgency = async (agencyBeingDeleted: any, preferredAgencyId?: string) => {
  if (preferredAgencyId) {
    if (!Types.ObjectId.isValid(preferredAgencyId)) {
      return { error: 'Invalid reassignAgencyId' };
    }
    if (preferredAgencyId === agencyBeingDeleted._id.toString()) {
      return { error: 'reassignAgencyId cannot be the agency being deleted' };
    }
    const preferred = await Agency.findById(preferredAgencyId);
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
  const agency =
    (agencyBeingDeleted.city &&
      (await Agency.findOne({ ...exclude, city: agencyBeingDeleted.city }).sort({ createdAt: 1 }))) ||
    (agencyBeingDeleted.state &&
      (await Agency.findOne({ ...exclude, state: agencyBeingDeleted.state }).sort({ createdAt: 1 }))) ||
    (await Agency.findOne(exclude).sort({ createdAt: 1 }));

  return agency ? { agency } : { error: null };
};

// Franchise-scoped roles don't travel with the staff — a FranchiseRole belongs
// to the agency it was created under. Match by name in the target agency when
// one exists, and otherwise drop the role so nobody keeps permissions granted
// by an agency that no longer exists.
const remapFranchiseRoles = async (staffList: any[], targetAgencyId: Types.ObjectId) => {
  for (const staff of staffList) {
    if (!staff.roleId) continue;

    const oldRole = await FranchiseRole.findById(staff.roleId).lean();
    if (!oldRole) continue; // not a FranchiseRole (AdminRole etc.) - leave it alone

    const newRole = await FranchiseRole.findOne({
      franchiseId: targetAgencyId,
      roleName: oldRole.roleName,
      status: true,
    }).lean();

    await Staff.updateOne(
      { _id: staff._id },
      newRole ? { $set: { roleId: newRole._id } } : { $unset: { roleId: '' } }
    );
  }
};

export class AgencyService {
  // Franchise Login
  async loginFranchise(username: string, password: string): Promise<ServiceResponse> {
    try {
      // Find agency by username
      const agency = await Agency.findOne({ username }).select('+password');

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
      const isPasswordValid = await bcrypt.compare(password, agency.password);

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
      const token = generateToken(agency._id.toString());

      return {
        success: true,
        message: 'Login successful',
        data: agencyData,
        token: token,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error during login',
      };
    }
  }

  // Create new agency
  async createAgency(data: CreateAgencyInput): Promise<ServiceResponse> {
    try {
      // Check phone global uniqueness
      const phoneError = await checkPhoneGloballyUnique(data.phone);
      if (phoneError) {
        return { success: false, message: phoneError };
      }

      // Check if agency with same name already exists
      const existingAgency = await Agency.findOne({ 
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
        const existingUsername = await Agency.findOne({
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
      let agencyData: any = { ...data };
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        agencyData.password = await bcrypt.hash(data.password, salt);
      }

      const agency = new Agency(agencyData);

      await agency.save();
      const populatedAgency = await Agency.findById(agency._id);

      return {
        success: true,
        message: 'Agency created successfully',
        data: populatedAgency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error creating agency',
      };
    }
  }

  // Get all agencies with pagination and search
  async getAllAgencies(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    type?: string,
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

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

      const agencies = await Agency.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Agency.countDocuments(query);

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
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching agencies',
      };
    }
  }

  // Get agency by ID
  async getAgencyById(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid agency ID',
        };
      }

      const agency = await Agency.findById(id);

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
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching agency',
      };
    }
  }

  // Update agency
  async updateAgency(id: string, data: UpdateAgencyInput): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid agency ID',
        };
      }

      const agency = await Agency.findById(id);

      if (!agency) {
        return {
          success: false,
          message: 'Agency not found',
        };
      }

      // Check if updating name and if new name already exists
      if (data.agencyName && data.agencyName !== agency.agencyName) {
        const existingAgency = await Agency.findOne({
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
        const existingUsername = await Agency.findOne({
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
        const phoneError = await checkPhoneGloballyUnique(data.phone, { model: 'Agency', id });
        if (phoneError) {
          return { success: false, message: phoneError };
        }
      }

      // Hash password if being updated
      let updateData: any = { ...data };
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(data.password, salt);
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof UpdateAgencyInput] !== undefined) {
          (agency as any)[key] = updateData[key as keyof UpdateAgencyInput];
        }
      });

      await agency.save();
      const updatedAgency = await Agency.findById(id);

      return {
        success: true,
        message: 'Agency updated successfully',
        data: updatedAgency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating agency',
      };
    }
  }

  // Delete agency
  async deleteAgency(id: string, reassignAgencyId?: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid agency ID',
        };
      }

      const agency = await Agency.findById(id);

      if (!agency) {
        return {
          success: false,
          message: 'Agency not found',
        };
      }

      const staffList = await Staff.find({ type: 'franchise', franchiseId: agency._id });

      let reassignedTo: any = null;

      if (staffList.length) {
        const { agency: targetAgency, error } = await findReassignmentAgency(
          agency,
          reassignAgencyId
        );

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

        await Staff.updateMany(
          { type: 'franchise', franchiseId: agency._id },
          { $set: { franchiseId: targetAgency._id } }
        );
        await remapFranchiseRoles(staffList, targetAgency._id as Types.ObjectId);

        reassignedTo = targetAgency;
      }

      await Agency.findByIdAndDelete(id);
      await FranchiseRole.deleteMany({ franchiseId: agency._id });

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
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting agency',
      };
    }
  }

  // Update agency status
  async updateAgencyStatus(
    id: string,
    status: 'Active' | 'Inactive'
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid agency ID',
        };
      }

      const agency = await Agency.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

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
    } catch (error: any) {
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
  async updateProfitPercentage(
    id: string,
    profitPercentage: number,
    charges: {
      loadingChargePercentage?: number;
      miscChargePercentage?: number;
    } = {}
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid agency ID',
        };
      }

      const agency = await Agency.findById(id);
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
        message:
          `Commission set to ${profitPercentage}% for "${agency.agencyName}" ` +
          `(loading ${agency.loadingChargePercentage}%, miscellaneous ` +
          `${agency.miscChargePercentage}%). Applies to new bookings.`,
        data: agency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating profit percentage',
      };
    }
  }

  // OTP Login - Send OTP
  async sendLoginOtp(phone: string, countryCode: string): Promise<ServiceResponse> {
    try {
      const agency = await Agency.findOne({ phone, status: 'Active' }).lean();
      if (!agency) {
        return { success: false, message: 'No active franchise account found with this phone number' };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await Otp.deleteMany({ phone, userType: 'franchise' });
      await Otp.create({ phone, countryCode, otp, expiresAt, userType: 'franchise' });

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
      const smsResponse = await axios.get(url, { timeout: 10000 });
      console.log('[Ping4SMS] Franchise OTP Response:', JSON.stringify(smsResponse.data));

      const responseStr = typeof smsResponse.data === 'string' ? smsResponse.data : JSON.stringify(smsResponse.data);
      if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
        return { success: false, message: `SMS sending failed: ${responseStr}` };
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      console.error('[Ping4SMS] Franchise OTP send failed:', {
        code: error?.code,
        status: error?.response?.status,
        message: error?.message,
      });

      // A timeout/refusal here means the SMS gateway was unreachable from the
      // server, not a problem with the caller's input — don't leak the raw
      // axios message to the login screen
      const isNetworkFailure =
        error?.code === 'ECONNABORTED' ||
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
  async verifyLoginOtp(phone: string, countryCode: string, otp: string): Promise<ServiceResponse> {
    try {
      const record = await Otp.findOne({ phone, used: false, userType: 'franchise' }).lean();
      if (!record) {
        return { success: false, message: 'OTP not found. Please request a new one' };
      }

      if (new Date() > record.expiresAt) {
        await Otp.deleteOne({ _id: record._id });
        return { success: false, message: 'OTP has expired. Please request a new one' };
      }

      if (record.otp !== otp) {
        return { success: false, message: 'Invalid OTP' };
      }

      await Otp.updateOne({ _id: record._id }, { used: true });

      const agency = await Agency.findOne({ phone, status: 'Active' }).lean();
      if (!agency) {
        return { success: false, message: 'No active franchise account found with this phone number' };
      }

      const token = generateToken((agency._id as Types.ObjectId).toString());

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
    } catch (error: any) {
      return { success: false, message: error.message || 'Error verifying OTP' };
    }
  }
}

export const agencyService = new AgencyService();
