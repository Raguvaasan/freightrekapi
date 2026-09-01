import { CollectionAgency } from '../../models/admin/collectionAgency.model';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { checkPhoneGloballyUnique } from '../../utils/phoneCheck';
import { generateToken } from '../../utils/jwt';
import { Otp } from '../../models/customer/otp.model';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  token?: string;
}

interface CreateCollectionAgencyInput {
  collectionAgencyName: string;
  ownerName: string;
  phone: string;
  status?: 'Active' | 'Inactive';
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  username?: string;
  password?: string;
}

interface UpdateCollectionAgencyInput {
  collectionAgencyName?: string;
  ownerName?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  username?: string;
  password?: string;
}

export class CollectionAgencyService {
  // OTP Login - Send OTP
  async sendLoginOtp(phone: string, countryCode: string): Promise<ServiceResponse> {
    try {
      const agency = await CollectionAgency.findOne({ phone, status: 'Active' }).lean();
      if (!agency) {
        return { success: false, message: 'No active collection agency account found with this phone number' };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await Otp.deleteMany({ phone, userType: 'collection_agency' });
      await Otp.create({ phone, countryCode, otp, expiresAt, userType: 'collection_agency' });

      const apiKey = process.env.PING4SMS_API_KEY;
      const sender = process.env.PING4SMS_SENDER;
      const templateId = process.env.PING4SMS_TEMPLATE_ID;
      const route = process.env.PING4SMS_ROUTE || '2';
      const fullPhone = `${countryCode.replace('+', '')}${phone}`;
      const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
      const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;

      console.log('[Ping4SMS] Collection Agency OTP URL:', url);
      const smsResponse = await axios.get(url, { timeout: 10000 });
      console.log('[Ping4SMS] Collection Agency OTP Response:', JSON.stringify(smsResponse.data));

      const responseStr = typeof smsResponse.data === 'string' ? smsResponse.data : JSON.stringify(smsResponse.data);
      if (responseStr.includes('-1') || responseStr.includes('-2') || responseStr.toLowerCase().includes('error') || responseStr.includes('INVALID')) {
        return { success: false, message: `SMS sending failed: ${responseStr}` };
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error sending OTP' };
    }
  }

  // OTP Login - Verify OTP
  async verifyLoginOtp(phone: string, countryCode: string, otp: string): Promise<ServiceResponse> {
    try {
      const record = await Otp.findOne({ phone, used: false, userType: 'collection_agency' }).lean();
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

      const agency = await CollectionAgency.findOne({ phone, status: 'Active' }).lean();
      if (!agency) {
        return { success: false, message: 'No active collection agency account found with this phone number' };
      }

      const token = generateToken((agency._id as Types.ObjectId).toString());

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
    } catch (error: any) {
      return { success: false, message: error.message || 'Error verifying OTP' };
    }
  }

  // Create new collection agency
  async createCollectionAgency(
    data: CreateCollectionAgencyInput
  ): Promise<ServiceResponse> {
    try {
      // Check phone global uniqueness
      const phoneError = await checkPhoneGloballyUnique(data.phone);
      if (phoneError) {
        return { success: false, message: phoneError };
      }

      // Check if collection agency with same name already exists
      const existing = await CollectionAgency.findOne({
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
        const existingUsername = await CollectionAgency.findOne({
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
      const agencyData: any = { ...data };
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        agencyData.password = await bcrypt.hash(data.password, salt);
      }

      const agency = new CollectionAgency(agencyData);
      await agency.save();

      const created = await CollectionAgency.findById(agency._id);

      return {
        success: true,
        message: 'Collection agency created successfully',
        data: created,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error creating collection agency',
      };
    }
  }

  // Get all collection agencies with pagination and search
  async getAllCollectionAgencies(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

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

      const agencies = await CollectionAgency.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await CollectionAgency.countDocuments(query);

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
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching collection agencies',
      };
    }
  }

  // Get collection agency by ID
  async getCollectionAgencyById(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid collection agency ID' };
      }

      const agency = await CollectionAgency.findById(id);

      if (!agency) {
        return { success: false, message: 'Collection agency not found' };
      }

      return { success: true, data: agency };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching collection agency',
      };
    }
  }

  // Update collection agency
  async updateCollectionAgency(
    id: string,
    data: UpdateCollectionAgencyInput
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid collection agency ID' };
      }

      const agency = await CollectionAgency.findById(id);

      if (!agency) {
        return { success: false, message: 'Collection agency not found' };
      }

      // Check if updating name and if new name already exists
      if (
        data.collectionAgencyName &&
        data.collectionAgencyName !== agency.collectionAgencyName
      ) {
        const existing = await CollectionAgency.findOne({
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
        const existingUsername = await CollectionAgency.findOne({
          username: data.username,
          _id: { $ne: id },
        });

        if (existingUsername) {
          return { success: false, message: 'Username already exists' };
        }
      }

      // Check phone global uniqueness if updating phone
      if (data.phone && data.phone !== agency.phone) {
        const phoneError = await checkPhoneGloballyUnique(data.phone, {
          model: 'CollectionAgency',
          id,
        });
        if (phoneError) {
          return { success: false, message: phoneError };
        }
      }

      // Hash password if being updated
      const updateData: any = { ...data };
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(data.password, salt);
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          (agency as any)[key] = updateData[key];
        }
      });

      await agency.save();
      const updated = await CollectionAgency.findById(id);

      return {
        success: true,
        message: 'Collection agency updated successfully',
        data: updated,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating collection agency',
      };
    }
  }

  // Delete collection agency
  async deleteCollectionAgency(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid collection agency ID' };
      }

      const agency = await CollectionAgency.findById(id);

      if (!agency) {
        return { success: false, message: 'Collection agency not found' };
      }

      await CollectionAgency.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Collection agency deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting collection agency',
      };
    }
  }

  // Update collection agency status
  async updateCollectionAgencyStatus(
    id: string,
    status: 'Active' | 'Inactive'
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid collection agency ID' };
      }

      const agency = await CollectionAgency.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!agency) {
        return { success: false, message: 'Collection agency not found' };
      }

      return {
        success: true,
        message: 'Collection agency status updated successfully',
        data: agency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating collection agency status',
      };
    }
  }
}

export const collectionAgencyService = new CollectionAgencyService();
