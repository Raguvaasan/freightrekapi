import { CollectionAgency } from '../../models/admin/collectionAgency.model';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { checkPhoneGloballyUnique } from '../../utils/phoneCheck';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
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
