import { AdminUser } from '../../models/admin/adminUser.model';
import { Agency } from '../../models/admin/agency.model';
import { HubModel } from '../../models/hub/hub.model';
import { Staff } from '../../models/admin/staff.model';
import { Otp } from '../../models/customer/otp.model';
import { generateToken } from '../../utils/jwt';
import { generateOtp, otpExpiry, sendOtpSms } from '../../utils/otpSms';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  token?: string;
  code?: number;
}

/**
 * Which login the phone number belongs to. `userType` is what the frontend
 * switches on to pick the landing screen.
 */
export type UnifiedUserType = 'admin' | 'agency' | 'hub' | 'staff';

interface ResolvedUser {
  userType: UnifiedUserType;
  id: string;
  name: string;
  /** Sub-type for staff: head_quarter | franchise | hub | b2b */
  staffType?: string;
  agencyId?: string;
  agencyName?: string;
  /** Ownership of the agency: 'Own' | 'Third Party' */
  agencyType?: string;
  hubId?: string;
  hubName?: string;
  roleId?: string;
  /** Where the frontend should land this user */
  module: 'admin' | 'agency' | 'hub';
  profile: any;
}

/**
 * Every field of a hub the frontend needs after login — the hub module renders
 * the address and manager straight from here, so the login response carries the
 * same details as GET /admin/hub/{id} (password is `select: false`, so it can
 * never leak through).
 */
const hubDetails = (hub: any) =>
  hub
    ? {
        id: hub._id,
        hubName: hub.hubName,
        hubManagerName: hub.hubManagerName,
        phone: hub.phoneNo,
        // `phoneNo` is what the hub endpoints return; kept alongside `phone`
        phoneNo: hub.phoneNo,
        address: hub.address,
        city: hub.city,
        state: hub.state,
        pincode: hub.pincode,
        username: hub.username,
        status: hub.status,
        createdAt: hub.createdAt,
        updatedAt: hub.updatedAt,
      }
    : null;

/**
 * One login for every internal user.
 *
 * A phone number is unique across AdminUser, Agency, Hub and Staff (enforced by
 * checkPhoneGloballyUnique), so the number alone identifies the account and the
 * type can be resolved rather than asked for.
 *
 * Collection agencies are deliberately not resolved here — that module is
 * hidden (see config/features).
 */
export class UnifiedAuthService {
  /** Find whichever account owns this phone number. */
  async resolveByPhone(phone: string): Promise<ResolvedUser | null> {
    const [admin, agency, staff] = await Promise.all([
      AdminUser.findOne({ phoneNo: phone }).populate('roleId'),
      Agency.findOne({ phone }),
      Staff.findOne({ phone }).populate('franchiseId hubId'),
    ]);

    if (admin) {
      return {
        userType: 'admin',
        id: admin._id.toString(),
        name: admin.name,
        roleId: (admin.roleId as any)?._id?.toString(),
        module: 'admin',
        profile: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phoneNo,
          status: admin.status,
          role: admin.roleId,
        },
      };
    }

    if (agency) {
      return {
        userType: 'agency',
        id: agency._id.toString(),
        name: agency.agencyName,
        agencyId: agency._id.toString(),
        agencyName: agency.agencyName,
        agencyType: agency.type,
        module: 'agency',
        profile: {
          id: agency._id,
          agencyName: agency.agencyName,
          agencyOwner: agency.agencyOwner,
          phone: agency.phone,
          email: agency.email,
          // `type` is the stored wording, `agencyType` the boolean the agency
          // form uses — both returned so either can be branched on
          type: agency.type,
          agencyType: agency.type === 'Own',
          status: agency.status,
          city: agency.city,
          state: agency.state,
          pincode: agency.pincode,
          profitPercentage: agency.profitPercentage,
        },
      };
    }

    if (staff) {
      const franchise: any = staff.franchiseId;
      const hub: any = staff.hubId;

      return {
        userType: 'staff',
        id: staff._id.toString(),
        name: staff.name,
        staffType: staff.type,
        agencyId: franchise?._id?.toString(),
        agencyName: franchise?.agencyName,
        agencyType: franchise?.type,
        hubId: hub?._id?.toString(),
        hubName: hub?.hubName,
        roleId: staff.roleId?.toString(),
        // A franchise staff member works the agency module, a hub staff member
        // the hub module, and head office the admin module
        module:
          staff.type === 'franchise' ? 'agency' : staff.type === 'hub' ? 'hub' : 'admin',
        profile: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          type: staff.type,
          status: staff.status,
          roleId: staff.roleId,
          agency: franchise
            ? {
                id: franchise._id,
                agencyName: franchise.agencyName,
                type: franchise.type,
                agencyType: franchise.type === 'Own',
              }
            : null,
          // A hub staff member lands in the hub module, so it needs the same
          // hub details a direct hub login gets
          hub: hubDetails(hub),
        },
      };
    }

    // Hub phone numbers are stored as a number
    const numericPhone = Number(phone);
    if (!isNaN(numericPhone)) {
      const hub = await HubModel.findOne({ phoneNo: numericPhone });
      if (hub) {
        return {
          userType: 'hub',
          id: hub._id.toString(),
          name: hub.hubName,
          hubId: hub._id.toString(),
          hubName: hub.hubName,
          module: 'hub',
          profile: hubDetails(hub),
        };
      }
    }

    return null;
  }

  /** Is the resolved account allowed to log in? */
  private inactiveReason(user: ResolvedUser): string | null {
    const p = user.profile;

    if (user.userType === 'admin' && p.status === false) {
      return 'Admin account is inactive';
    }
    if (user.userType === 'agency' && p.status !== 'Active') {
      return 'Agency account is inactive';
    }
    if (user.userType === 'staff' && p.status !== 'Active') {
      return 'User account is inactive';
    }
    if (user.userType === 'hub' && !p.status) {
      return 'Hub account is inactive';
    }
    return null;
  }

  /** Step 1: send the OTP, without revealing which type the number belongs to */
  async sendLoginOtp(phone: string, countryCode: string): Promise<ServiceResponse> {
    try {
      const user = await this.resolveByPhone(phone);
      if (!user) {
        return {
          success: false,
          code: 404,
          message: 'No account found with this phone number',
        };
      }

      const inactive = this.inactiveReason(user);
      if (inactive) {
        return { success: false, code: 403, message: inactive };
      }

      const otp = generateOtp();

      await Otp.deleteMany({ phone, userType: 'unified' });
      await Otp.create({
        phone,
        countryCode,
        otp,
        expiresAt: otpExpiry(),
        userType: 'unified',
      });

      const sms = await sendOtpSms(phone, countryCode, otp);
      if (!sms.success) {
        return { success: false, message: sms.message };
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        // Enough for the UI to show "Logging in as ..." without leaking details
        data: { userType: user.userType, module: user.module },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error sending OTP',
      };
    }
  }

  /** Step 2: verify the OTP and hand back a token plus the resolved user type */
  async verifyLoginOtp(
    phone: string,
    countryCode: string,
    otp: string
  ): Promise<ServiceResponse> {
    try {
      const record = await Otp.findOne({ phone, used: false, userType: 'unified' }).lean();
      if (!record) {
        return {
          success: false,
          code: 400,
          message: 'OTP not found. Please request a new one',
        };
      }

      if (new Date() > record.expiresAt) {
        await Otp.deleteOne({ _id: record._id });
        return {
          success: false,
          code: 400,
          message: 'OTP has expired. Please request a new one',
        };
      }

      if (record.otp !== otp) {
        return { success: false, code: 401, message: 'Invalid OTP' };
      }

      const user = await this.resolveByPhone(phone);
      if (!user) {
        return {
          success: false,
          code: 404,
          message: 'No account found with this phone number',
        };
      }

      const inactive = this.inactiveReason(user);
      if (inactive) {
        return { success: false, code: 403, message: inactive };
      }

      // Only consume the OTP once everything else has passed, so a failed
      // lookup does not force the user to request a fresh code
      await Otp.updateOne({ _id: record._id }, { used: true });

      // The token carries the record _id, which is what resolveParcelActor and
      // checkPermission look up — same shape as every other login here.
      const token = generateToken(user.id);

      return {
        success: true,
        message: 'Login successful',
        token,
        data: {
          userType: user.userType,
          staffType: user.staffType,
          module: user.module,
          name: user.name,
          agencyId: user.agencyId,
          agencyName: user.agencyName,
          agencyType: user.agencyType,
          hubId: user.hubId,
          hubName: user.hubName,
          user: user.profile,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error verifying OTP',
      };
    }
  }

  /** Who does this phone number belong to (no OTP sent) — for a pre-check */
  async lookupPhone(phone: string): Promise<ServiceResponse> {
    try {
      const user = await this.resolveByPhone(phone);
      if (!user) {
        return {
          success: false,
          code: 404,
          message: 'No account found with this phone number',
        };
      }

      return {
        success: true,
        data: {
          userType: user.userType,
          staffType: user.staffType,
          module: user.module,
          name: user.name,
          agencyType: user.agencyType,
          active: this.inactiveReason(user) === null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error looking up the phone number',
      };
    }
  }
}

export const unifiedAuthService = new UnifiedAuthService();
