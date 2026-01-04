import { Agency, IAgency } from '../../models/admin/agency.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateAgencyInput {
  agencyName: string;
  agencyOwner: string;
  phone: string;
  status?: 'Active' | 'Inactive';
  agencyType?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

interface UpdateAgencyInput {
  agencyName?: string;
  agencyOwner?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  agencyType?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

export class AgencyService {
  // Create new agency
  async createAgency(data: CreateAgencyInput): Promise<ServiceResponse> {
    try {
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

      const agency = new Agency({
        ...data,
      });

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
        ];
      }

      // Status filter
      if (status) {
        query.status = status;
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

      // Update fields
      Object.keys(data).forEach((key) => {
        if (data[key as keyof UpdateAgencyInput] !== undefined) {
          (agency as any)[key] = data[key as keyof UpdateAgencyInput];
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
  async deleteAgency(id: string): Promise<ServiceResponse> {
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

      await Agency.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Agency deleted successfully',
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
}

export const agencyService = new AgencyService();
