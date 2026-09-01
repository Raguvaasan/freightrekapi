import axios from 'axios';
import { AppCustomer } from '../models/customer/appCustomer.model';
import { Customer } from '../models/customer/customer.model';
import { Otp } from '../models/customer/otp.model';
import { generateToken } from '../utils/jwt';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

export const customerAuthService = {
  async register(input: RegisterInput): Promise<ServiceResponse> {
    const { firstName, lastName, email, phone, countryCode } = input;

    // Check email & phone uniqueness in parallel
    const [existingEmail, existingPhone] = await Promise.all([
      AppCustomer.findOne({ email, status: 'Active' }).lean(),
      AppCustomer.findOne({ phone, countryCode, status: 'Active' }).lean(),
    ]);

    if (existingEmail) {
      return { success: false, message: 'An account with this email already exists. Please login' };
    }

    if (existingPhone) {
      return { success: false, message: 'An account with this phone number already exists. Please login' };
    }

    // Remove stale pending registrations for same phone/email
    await AppCustomer.deleteMany({
      $or: [{ email }, { phone, countryCode }],
      status: 'Pending',
    });

    // Create customer as Pending + generate OTP in parallel
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Promise.all([
      AppCustomer.create({
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        status: 'Pending',
      }),
      Otp.deleteMany({ phone }).then(() =>
        Otp.create({ phone, countryCode, otp, expiresAt })
      ),
    ]);

    // Send SMS via Ping4SMS
    const apiKey = process.env.PING4SMS_API_KEY;
    const sender = process.env.PING4SMS_SENDER;
    const templateId = process.env.PING4SMS_TEMPLATE_ID;
    const route = process.env.PING4SMS_ROUTE || '2';
    const fullPhone = `${countryCode.replace('+', '')}${phone}`;
    const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;

    const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;

    console.log('[Ping4SMS] URL:', url);
    const smsResponse = await axios.get(url, { timeout: 10000 });
    console.log('[Ping4SMS] Response:', JSON.stringify(smsResponse.data));

    const responseData = smsResponse.data;
    const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);

    if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
      console.error('[Ping4SMS] SMS failed:', responseStr);
      // Rollback pending customer creation on SMS failure
      await AppCustomer.deleteMany({ phone, countryCode, status: 'Pending' });
      return { success: false, message: `SMS sending failed: ${responseStr}` };
    }

    return {
      success: true,
      message: 'OTP sent to your phone. Please verify to complete registration',
    };
  },

  async sendOtp(phone: string, countryCode: string): Promise<ServiceResponse> {
    // Only Active accounts can use login OTP; Pending accounts must use /register flow
    const customer = await AppCustomer.findOne({ phone, status: 'Active' }).lean();
    if (!customer) {
      return { success: false, message: 'No active account found with this phone number. Please register first' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old OTPs and create new one
    await Otp.deleteMany({ phone });

    // Save new OTP (use countryCode from customer record)
    await Otp.create({ phone, countryCode: customer.countryCode, otp, expiresAt });

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
    const smsResponse = await axios.get(url, { timeout: 10000 });
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

  async verifyOtp(phone: string, countryCode: string, otp: string): Promise<ServiceResponse> {
    const record = await Otp.findOne({ phone, used: false }).lean();

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

    // Mark OTP as used
    await Otp.updateOne({ _id: record._id }, { used: true });

    // Find customer account (Pending = completing registration, Active = login)
    const customer = await AppCustomer.findOne({ phone });
    if (!customer) {
      return { success: false, message: 'No account found with this phone number. Please register first' };
    }

    if (customer.status === 'Inactive') {
      return { success: false, message: 'Your account has been deactivated. Please contact support' };
    }

    let responseMessage = 'Login successful';

    if (customer.status === 'Pending') {
      // Complete registration: activate account and sync to admin customers collection
      customer.status = 'Active';
      await customer.save();

      const existingAdminCustomer = await Customer.findOne({ email: customer.email });
      if (!existingAdminCustomer) {
        await Customer.create({
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          status: 'Active',
        });
      }

      responseMessage = 'Registration successful';
    }

    const token = generateToken(customer._id.toString());

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
