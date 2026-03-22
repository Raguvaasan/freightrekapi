import { Staff, IStaff } from '../../models/admin/staff.model';
import { Role } from '../../models/admin/role.model';
import { FranchiseRole } from '../../models/admin/franchiseRole.model';
import { Agency } from '../../models/admin/agency.model';
import { HubModel as Hub } from '../../models/hub/hub.model';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateStaffInput {
  name: string;
  email: string;
  phone: string;
  type: 'head_quarter' | 'franchise' | 'hub';
  roleId?: string;
  status?: 'Active' | 'Inactive';
  franchiseId?: string;
  hubId?: string;
  username: string;
  password: string;
}

interface UpdateStaffInput {
  name?: string;
  email?: string;
  phone?: string;
  type?: 'head_quarter' | 'franchise' | 'hub';
  roleId?: string;
  status?: 'Active' | 'Inactive';
  franchiseId?: string;
  hubId?: string;
  username?: string;
  password?: string;
}

export class StaffService {
  // Staff Login (Generic - for backward compatibility)
  async loginStaff(username: string, password: string): Promise<ServiceResponse> {
    try {
      // Find staff by username
      const staff = await Staff.findOne({ username })
        .select('+password')
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

      // Manually populate roleId - check both AdminRole and FranchiseRole
      if (staff.roleId) {
        let roleData: any = await Role.findById(staff.roleId).select('name permissions').lean();
        if (!roleData) {
          roleData = await FranchiseRole.findById(staff.roleId).select('roleName permissions').lean();
          if (roleData) {
            // Map roleName to name for consistency
            roleData = { ...roleData, name: roleData.roleName };
          }
        }
        if (roleData) {
          (staff as any).roleId = roleData;
        }
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

  // Franchise Staff Login (Specific)
  async loginFranchiseStaff(username: string, password: string): Promise<ServiceResponse> {
    try {
      // Find staff by username
      const staff = await Staff.findOne({ username })
        .select('+password')
        .populate('franchiseId', 'agencyName');

      if (!staff) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Check if staff type is franchise
      if (staff.type !== 'franchise') {
        return {
          success: false,
          message: 'Invalid credentials. This is not a franchise staff account.',
        };
      }

      // Verify franchiseId exists
      if (!staff.franchiseId) {
        return {
          success: false,
          message: 'Franchise information missing. Contact administrator.',
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
        message: 'Franchise staff login successful',
        data: staffData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error during login',
      };
    }
  }

  // Head Quarter Staff Login (Specific)
  async loginHeadQuarterStaff(username: string, password: string): Promise<ServiceResponse> {    try {
      // Find staff by username
      const staff = await Staff.findOne({ username })
        .select('+password');

      if (!staff) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Check if staff type is head_quarter
      if (staff.type !== 'head_quarter') {
        return {
          success: false,
          message: 'Invalid credentials. This is not a head quarter staff account.',
        };
      }

      // Verify roleId exists
      if (!staff.roleId) {
        return {
          success: false,
          message: 'Role information missing. Contact administrator.',
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

      // Populate roleId from AdminRole
      let roleData: any = await Role.findById(staff.roleId).select('name permissions').lean();
      if (roleData) {
        (staff as any).roleId = roleData;
      }

      // Remove password from response
      const staffData: any = staff.toObject();
      delete staffData.password;

      return {
        success: true,
        message: 'Head quarter staff login successful',
        data: staffData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error during login',
      };
    }
  }

  // Hub Staff Login (Specific)
  async loginHubStaff(username: string, password: string): Promise<ServiceResponse> {
    try {
      const staff = await Staff.findOne({ username })
        .select('+password')
        .populate('hubId', 'hubName city');

      if (!staff) {
        return { success: false, message: 'Invalid credentials' };
      }

      if (staff.type !== 'hub') {
        return { success: false, message: 'Invalid credentials. This is not a hub staff account.' };
      }

      if (!staff.hubId) {
        return { success: false, message: 'Hub information missing. Contact administrator.' };
      }

      const isPasswordValid = await bcrypt.compare(password, staff.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      if (staff.status !== 'Active') {
        return { success: false, message: 'Staff account is inactive' };
      }

      const staffData: any = staff.toObject();
      delete staffData.password;

      const token = generateToken(staff._id.toString());

      return { success: true, message: 'Hub staff login successful', data: { ...staffData, token } };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error during login' };
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
        // Head quarter staff must not have franchiseId
        if (data.franchiseId) {
          return {
            success: false,
            message: 'Franchise should not be provided for head quarter staff',
          };
        }
        // Validate roleId if provided
        if (data.roleId) {
          const roleExists = await Role.findById(data.roleId) || await FranchiseRole.findById(data.roleId);
          if (!roleExists) {
            return {
              success: false,
              message: 'Role not found',
            };
          }
        }
      } else if (data.type === 'franchise') {
        // Franchise staff must have franchiseId
        if (!data.franchiseId) {
          return {
            success: false,
            message: 'Franchise is required for franchise staff',
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
        // Validate roleId if provided (check both AdminRole and FranchiseRole)
        if (data.roleId) {
          const roleExists = await Role.findById(data.roleId) || await FranchiseRole.findById(data.roleId);
          if (!roleExists) {
            return {
              success: false,
              message: 'Role not found',
            };
          }
        }
      } else if (data.type === 'hub') {
        // Hub staff must have hubId
        if (!data.hubId) {
          return { success: false, message: 'Hub is required for hub staff' };
        }
        const hubExists = await Hub.findById(data.hubId);
        if (!hubExists) {
          return { success: false, message: 'Hub not found' };
        }
        if (data.roleId) {
          const roleExists = await Role.findById(data.roleId) || await FranchiseRole.findById(data.roleId);
          if (!roleExists) {
            return { success: false, message: 'Role not found' };
          }
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
      
      // Fetch created staff and manually populate roleId from correct collection
      const populatedStaff = await Staff.findById(staff._id)
        .populate('franchiseId', 'agencyName agencyOwner')
        .populate('hubId', 'hubName city');
      
      // Manually populate roleId - check both AdminRole and FranchiseRole
      if (populatedStaff && populatedStaff.roleId) {
        let roleData: any = await Role.findById(populatedStaff.roleId).select('name permissions').lean();
        if (!roleData) {
          roleData = await FranchiseRole.findById(populatedStaff.roleId).select('roleName permissions').lean();
          if (roleData) {
            // Map roleName to name for consistency
            roleData = { ...roleData, name: roleData.roleName };
          }
        }
        if (roleData) {
          (populatedStaff as any).roleId = roleData;
        }
      }

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
        .populate('franchiseId', 'agencyName agencyOwner')
        .populate('hubId', 'hubName city');

      // Manually populate roleId for each staff - check both AdminRole and FranchiseRole
      for (const s of staff) {
        if (s.roleId) {
          let roleData: any = await Role.findById(s.roleId).select('name permissions').lean();
          if (!roleData) {
            roleData = await FranchiseRole.findById(s.roleId).select('roleName permissions').lean();
            if (roleData) {
              // Map roleName to name for consistency
              roleData = { ...roleData, name: roleData.roleName };
            }
          }
          if (roleData) {
            (s as any).roleId = roleData;
          }
        }
      }

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
        .populate('franchiseId', 'agencyName agencyOwner')
        .populate('hubId', 'hubName city');

      if (!staff) {
        return {
          success: false,
          message: 'Staff not found',
        };
      }

      // Manually populate roleId - check both AdminRole and FranchiseRole
      if (staff.roleId) {
        let roleData: any = await Role.findById(staff.roleId).select('name permissions').lean();
        if (!roleData) {
          roleData = await FranchiseRole.findById(staff.roleId).select('roleName permissions').lean();
          if (roleData) {
            // Map roleName to name for consistency
            roleData = { ...roleData, name: roleData.roleName };
          }
        }
        if (roleData) {
          (staff as any).roleId = roleData;
        }
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
          const roleExists = await Role.findById(data.roleId) || await FranchiseRole.findById(data.roleId);
          if (!roleExists) {
            return {
              success: false,
              message: 'Role not found',
            };
          }
        }
      } else if (staffType === 'franchise') {
        // If roleId is being updated, validate it exists
        if (data.roleId) {
          const roleExists = await Role.findById(data.roleId) || await FranchiseRole.findById(data.roleId);
          if (!roleExists) {
            return {
              success: false,
              message: 'Role not found',
            };
          }
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
      } else if (staffType === 'hub') {
        if (data.roleId) {
          const roleExists = await Role.findById(data.roleId) || await FranchiseRole.findById(data.roleId);
          if (!roleExists) {
            return { success: false, message: 'Role not found' };
          }
        }
        if (data.hubId) {
          const hubExists = await Hub.findById(data.hubId);
          if (!hubExists) {
            return { success: false, message: 'Hub not found' };
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
      
      // Fetch updated staff and manually populate roleId from correct collection
      const updatedStaff = await Staff.findById(id)
        .populate('franchiseId', 'agencyName agencyOwner')
        .populate('hubId', 'hubName city');
      
      // Manually populate roleId - check both AdminRole and FranchiseRole
      if (updatedStaff && updatedStaff.roleId) {
        let roleData: any = await Role.findById(updatedStaff.roleId).select('name permissions').lean();
        if (!roleData) {
          roleData = await FranchiseRole.findById(updatedStaff.roleId).select('roleName permissions').lean();
          if (roleData) {
            // Map roleName to name for consistency
            roleData = { ...roleData, name: roleData.roleName };
          }
        }
        if (roleData) {
          (updatedStaff as any).roleId = roleData;
        }
      }

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
        .populate('franchiseId', 'agencyName agencyOwner')
        .populate('hubId', 'hubName city');

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
