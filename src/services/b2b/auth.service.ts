import axios from 'axios';
import { B2bOtp } from '../../models/b2b/b2bOtp.model';
import { B2bUser } from '../../models/b2b/b2bUser.model';
import { generateToken } from '../../utils/jwt';
import { Types } from 'mongoose';

const sendSms = async (mobileNumber: string, otp: string, countryCode = '+91') => {
  const apiKey = process.env.PING4SMS_API_KEY;
  const sender = process.env.PING4SMS_SENDER;
  const templateId = process.env.PING4SMS_TEMPLATE_ID;
  const route = process.env.PING4SMS_ROUTE || '2';
  const fullPhone = `${countryCode.replace('+', '')}${mobileNumber.replace(/^\+/, '')}`;
  // Keep this identical to the working Agency OTP template for DLT matching.
  const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
  const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
  console.log('[Ping4SMS] B2B OTP URL:', url);
  const response = await axios.get(url, { timeout: 10000 });
  console.log('[Ping4SMS] B2B OTP Response:', JSON.stringify(response.data));
  const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  if (body.includes('-1') || body.includes('-2') || body.toLowerCase().includes('error') || body.includes('INVALID')) {
    throw new Error(`SMS sending failed: ${body}`);
  }
};

const normalizeMobile = (mobileNumber: string) => String(mobileNumber).replace(/\D/g, '').slice(-10);

export const b2bAuthService = {
  async register(input: any) {
    const mobileNumber = normalizeMobile(input.mobileNumber);
    const existing = await B2bUser.findOne({ mobileNumber });
    if (existing) return { success: false, message: 'B2B user already exists' };
    const user = await B2bUser.create({ ...input, mobileNumber });
    return { success: true, message: 'B2B registered successfully', data: user };
  },
  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid B2B user ID' };
    const user = await B2bUser.findById(id);
    if (!user) return { success: false, message: 'B2B user not found' };
    return { success: true, data: user };
  },
  async update(id: string, payload: any) {
    if (!Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid B2B user ID' };
    const update: any = {};
    for (const field of ['name', 'mobileNumber', 'address', 'state', 'pincode', 'gstNumber', 'status']) {
      if (payload[field] !== undefined) update[field] = payload[field];
    }
    const user = await B2bUser.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!user) return { success: false, message: 'B2B user not found' };
    return { success: true, message: 'B2B user updated successfully', data: user };
  },
  async list(query: any = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const search = String(query.search || '').trim();
    const filter: any = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobileNumber: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
      { state: { $regex: search, $options: 'i' } },
      { pincode: { $regex: search, $options: 'i' } },
    ];
    if (query.status) filter.status = query.status;
    const [users, total] = await Promise.all([
      B2bUser.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      B2bUser.countDocuments(filter),
    ]);
    return { success: true, data: { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
  },
  async sendOtp(mobileNumber: string, countryCode = '+91') {
    mobileNumber = normalizeMobile(mobileNumber);
    const user = await B2bUser.findOne({ mobileNumber, status: 'Active' });
    if (!user) return { success: false, message: 'No active B2B user found with this mobile number' };
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await B2bOtp.deleteMany({ mobileNumber });
    await B2bOtp.create({ mobileNumber, otp, expiresAt });
    try {
      await sendSms(mobileNumber, otp, countryCode);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      await B2bOtp.deleteOne({ mobileNumber, otp });
      return { success: false, message: error.message || 'Error sending OTP' };
    }
  },
  async verifyOtp(mobileNumber: string, otp: string) {
    mobileNumber = normalizeMobile(mobileNumber);
    const record = await B2bOtp.findOne({ mobileNumber, used: false }).sort({ createdAt: -1 });
    if (!record) return { success: false, message: 'OTP not found. Please request a new one' };
    if (new Date() > record.expiresAt) return { success: false, message: 'OTP has expired. Please request a new one' };
    if (record.otp !== otp) return { success: false, message: 'Invalid OTP' };
    await B2bOtp.updateOne({ _id: record._id }, { used: true });
    const user = await B2bUser.findOne({ mobileNumber, status: 'Active' });
    if (!user) return { success: false, message: 'No active B2B user found' };
    const token = generateToken(user._id.toString());
    return { success: true, message: 'Login successful', data: { token, user } };
  },
};
