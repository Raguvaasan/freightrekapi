import bcrypt from 'bcryptjs';
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
  password: string;
}

export const customerAuthService = {
  async register(input: RegisterInput): Promise<ServiceResponse> {
    const { firstName, lastName, email, phone, countryCode, password } = input;

    const existingEmail = await AppCustomer.findOne({ email });
    if (existingEmail) {
      return { success: false, message: 'An account with this email already exists' };
    }

    const existingPhone = await AppCustomer.findOne({ phone, countryCode });
    if (existingPhone) {
      return { success: false, message: 'An account with this phone number already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await AppCustomer.create({
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      password: hashedPassword,
    });

    // Also add to admin customers collection (name = firstName + lastName)
    const existingAdminCustomer = await Customer.findOne({ email });
    if (!existingAdminCustomer) {
      await Customer.create({
        name: `${firstName} ${lastName}`,
        email,
        phone,
        status: 'Active',
      });
    }

    const token = generateToken(customer._id.toString());

    return {
      success: true,
      message: 'Registration successful',
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

  async sendOtp(phone: string, countryCode: string): Promise<ServiceResponse> {
    // Check if account exists before sending OTP (search by phone only)
    const customer = await AppCustomer.findOne({ phone });
    if (!customer) {
      return { success: false, message: 'No account found with this phone number. Please register first' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this phone
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
    const message = `Dear Customer,${otp} is your verification code -PNGOTP`;

    const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;

    console.log('[Ping4SMS] URL:', url);
    const smsResponse = await axios.get(url);
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
    const record = await Otp.findOne({ phone, used: false });

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

    // Find customer account (search by phone only)
    const customer = await AppCustomer.findOne({ phone });
    if (!customer) {
      return { success: false, message: 'No account found with this phone number. Please register first' };
    }

    const token = generateToken(customer._id.toString());

    return {
      success: true,
      message: 'Login successful',
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
