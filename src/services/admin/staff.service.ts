import { Staff, IStaff } from '../../models/admin/staff.model';
import { Role } from '../../models/admin/role.model';
import { Agency } from '../../models/admin/agency.model';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateStaffInput {
  name: string;
  email: string;
  phone: string;
  type: 'head_quarter' | 'franchise';
  roleId?: string;
  status?: 'Active' | 'Inactive';
  franchiseId?: string;
  username: string;
  password: string;
}

interface UpdateStaffInput {
  name?: string;
  email?: string;
  phone?: string;
  type?: 'head_quarter' | 'franchise';
  roleId?: string;
  status?: 'Active' | 'Inactive';
  franchiseId?: string;
  username?: string;
  password?: string;
}

export class StaffService {
  // Staff Login
  async loginStaff(username: string, password: string): Promise<ServiceResponse> {
    try {
      // Find staff by username
      const staff = await Staff.findOne({ username })
        .select('+password')
        .populate('roleId', 'name permissions')
        .populate('franchiseId', 'agencyName');

      if (!staff) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, staff.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Check if staff is active
      if (staff.status !== 'Active') {
        return {
          success: false,
          message: 'Staff account is inactive',
        };
      }

      // Remove password from response
      const staffData: any = staff.toObject();
      delete staffData.password;

      return {
        success: true,
        message: 'Login successful',
        data: staffData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error during login',
      };
    }
  }

  // Create new staff
  async createStaff(data: CreateStaffInput): Promise<ServiceResponse> {
    try {
      // Check if email already exists
      const existingEmail = await Staff.findOne({ email: data.email });
      if (existingEmail) {
        return {
          success: false,
          message: 'Email already exists',
        };
      }

      // Check if username already exists
      const existingUsername = await Staff.findOne({ username: data.username });
      if (existingUsername) {
        return {
          success: false,
          message: 'Username already exists',
        };
      }

      // Validate based on type
      if (data.type === 'head_quarter') {
        // Head quarter staff must have roleId and must not have franchiseId
        if (!data.roleId) {
          return {
            success: false,
            message: 'Role is required for head quarter staff',
          };
        }
        if (data.franchiseId) {
          return {
            success: false,
            message: 'Franchise should not be provided for head quarter staff',
          };
        }
        // Validate roleId exists
        const roleExists = await Role.findById(data.roleId);
        if (!roleExists) {
          return {
            success: false,
            message: 'Role not found',
          };
        }
      } else if (data.type === 'franchise') {
        // Franchise staff must have franchiseId and must not have roleId
        if (!data.franchiseId) {
          return {
            success: false,
            message: 'Franchise is required for franchise staff',
          };
        }
        if (data.roleId) {
          return {
            success: false,
            message: 'Role should not be provided for franchise staff',
          };
        }
        // Validate franchiseId exists
        const franchiseExists = await Agency.findById(data.franchiseId);
        if (!franchiseExists) {
          return {
            success: false,
            message: 'Franchise not found',
          };
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const staff = new Staff({
        ...data,
        password: hashedPassword,
      });

      await staff.save();
      
      // Build populate query based on what fields exist
      let query = Staff.findById(staff._id);
      if (data.roleId) {
        query = query.populate('roleId', 'name permissions');
      }
      if (data.franchiseId) {
        query = query.populate('franchiseId', 'agencyName agencyOwner');
      }
      
      const populatedStaff = await query;

      return {
        success: true,
        message: 'Staff created successfully',
        data: populatedStaff,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error creating staff',
      };
    }
  }

  // Get all staff with pagination and search
  async getAllStaff(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    franchiseId?: string,
    roleId?: string,
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ];
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Franchise filter
      if (franchiseId && Types.ObjectId.isValid(franchiseId)) {
        query.franchiseId = franchiseId;
      }

      // Role filter
      if (roleId && Types.ObjectId.isValid(roleId)) {
        query.roleId = roleId;
      }

      const staff = await Staff.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('roleId', 'name permissions')
        .populate('franchiseId', 'agencyName agencyOwner');

      const total = await Staff.countDocuments(query);

      return {
        success: true,
        data: {
          staff,
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
        message: error.message || 'Error fetching staff',
      };
    }
  }

  // Get staff by ID
  async getStaffById(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid staff ID',
        };
      }

      const staff = await Staff.findById(id)
        .populate('roleId', 'name permissions')
        .populate('franchiseId', 'agencyName agencyOwner');

      if (!staff) {
        return {
          success: false,
          message: 'Staff not found',
        };
      }

      return {
        success: true,
        data: staff,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching staff',
      };
    }
  }

  // Update staff
  async updateStaff(id: string, data: UpdateStaffInput): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid staff ID',
        };
      }

      const staff = await Staff.findById(id);

      if (!staff) {
        return {
          success: false,
          message: 'Staff not found',
        };
      }

      // Check if updating email and if new email already exists
      if (data.email && data.email !== staff.email) {
        const existingEmail = await Staff.findOne({
          email: data.email,
          _id: { $ne: id },
        });

        if (existingEmail) {
          return {
            success: false,
            message: 'Email already exists',
          };
        }
      }

      // Check if updating username and if new username already exists
      if (data.username && data.username !== staff.username) {
        const existingUsername = await Staff.findOne({
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

      // Determine the type (use updated type or existing type)
      const staffType = data.type || staff.type;

      // Validate based on type
      if (staffType === 'head_quarter') {
        // Head quarter staff must not have franchiseId
        if (data.franchiseId) {
          return {
            success: false,
            message: 'Franchise should not be provided for head quarter staff',
          };
        }
        // If roleId is being updated, validate it exists
        if (data.roleId) {
          const roleExists = await Role.findById(data.roleId);
          if (!roleExists) {
            return {
              success: false,
              message: 'Role not found',
            };
          }
        }
      } else if (staffType === 'franchise') {
        // Franchise staff must not have roleId
        if (data.roleId) {
          return {
            success: false,
            message: 'Role should not be provided for franchise staff',
          };
        }
        // If franchiseId is being updated, validate it exists
        if (data.franchiseId) {
          const franchiseExists = await Agency.findById(data.franchiseId);
          if (!franchiseExists) {
            return {
              success: false,
              message: 'Franchise not found',
            };
          }
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
        if (updateData[key as keyof UpdateStaffInput] !== undefined) {
          (staff as any)[key] = updateData[key as keyof UpdateStaffInput];
        }
      });

      await staff.save();
      
      // Build populate query based on what fields exist
      let query = Staff.findById(id);
      if (staff.roleId) {
        query = query.populate('roleId', 'name permissions');
      }
      if (staff.franchiseId) {
        query = query.populate('franchiseId', 'agencyName agencyOwner');
      }
      
      const updatedStaff = await query;

      return {
        success: true,
        message: 'Staff updated successfully',
        data: updatedStaff,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating staff',
      };
    }
  }

  // Delete staff
  async deleteStaff(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid staff ID',
        };
      }

      const staff = await Staff.findById(id);

      if (!staff) {
        return {
          success: false,
          message: 'Staff not found',
        };
      }

      await Staff.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Staff deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting staff',
      };
    }
  }

  // Update staff status
  async updateStaffStatus(id: string, status: 'Active' | 'Inactive'): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid staff ID',
        };
      }

      const staff = await Staff.findById(id);

      if (!staff) {
        return {
          success: false,
          message: 'Staff not found',
        };
      }

      staff.status = status;
      await staff.save();

      const updatedStaff = await Staff.findById(id)
        .populate('roleId', 'name permissions')
        .populate('franchiseId', 'agencyName agencyOwner');

      return {
        success: true,
        message: 'Staff status updated successfully',
        data: updatedStaff,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating staff status',
      };
    }
  }
}

export const staffService = new StaffService();
