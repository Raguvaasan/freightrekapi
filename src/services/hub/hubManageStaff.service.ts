import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { Staff } from '../../models/admin/staff.model';
import { HubRole } from '../../models/hub/hubRole.model';
import { HubModel } from '../../models/hub/hub.model';

// List hub's own staff
export const getHubStaff = async (
  hubId: string,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = { type: 'hub', hubId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const staffList = await Staff.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('hubId', 'hubName city');

    for (const s of staffList) {
      if (s.roleId) {
        const roleData: any = await HubRole.findById(s.roleId).select('roleName permissions').lean();
        if (roleData) {
          (s as any).roleId = roleData;
        }
      }
    }

    const total = await Staff.countDocuments(query);

    return {
      success: true,
      data: {
        staff: staffList,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

// Get single hub staff by ID (must belong to this hub)
export const getHubStaffById = async (hubId: string, staffId: string) => {
  try {
    if (!Types.ObjectId.isValid(staffId)) {
      return { success: false, message: 'Invalid staff ID' };
    }

    const staff = await Staff.findOne({ _id: staffId, type: 'hub', hubId })
      .populate('hubId', 'hubName city');

    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }

    if (staff.roleId) {
      const roleData: any = await HubRole.findById(staff.roleId).select('roleName permissions').lean();
      if (roleData) {
        (staff as any).roleId = roleData;
      }
    }

    return { success: true, data: staff };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

// Create hub staff (scoped to this hub)
export const createHubStaff = async (hubId: string, data: any) => {
  try {
    const existingEmail = await Staff.findOne({ email: data.email });
    if (existingEmail) {
      return { success: false, message: 'Email already exists' };
    }

    const existingUsername = await Staff.findOne({ username: data.username });
    if (existingUsername) {
      return { success: false, message: 'Username already exists' };
    }

    if (data.roleId) {
      const roleExists = await HubRole.findOne({ _id: data.roleId, hubId });
      if (!roleExists) {
        return { success: false, message: 'Role not found for this hub' };
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const staff = new Staff({
      ...data,
      type: 'hub',
      hubId,
      password: hashedPassword,
    });

    await staff.save();

    const populated = await Staff.findById(staff._id).populate('hubId', 'hubName city');

    if (populated && populated.roleId) {
      const roleData: any = await HubRole.findById(populated.roleId).select('roleName permissions').lean();
      if (roleData) {
        (populated as any).roleId = roleData;
      }
    }

    return { success: true, message: 'Staff created successfully', data: populated };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

// Update hub staff (must belong to this hub)
export const updateHubStaff = async (hubId: string, staffId: string, data: any) => {
  try {
    if (!Types.ObjectId.isValid(staffId)) {
      return { success: false, message: 'Invalid staff ID' };
    }

    const staff = await Staff.findOne({ _id: staffId, type: 'hub', hubId });
    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }

    if (data.email && data.email !== staff.email) {
      const exists = await Staff.findOne({ email: data.email, _id: { $ne: staffId } });
      if (exists) {
        return { success: false, message: 'Email already exists' };
      }
    }

    if (data.username && data.username !== staff.username) {
      const exists = await Staff.findOne({ username: data.username, _id: { $ne: staffId } });
      if (exists) {
        return { success: false, message: 'Username already exists' };
      }
    }

    if (data.roleId) {
      const roleExists = await HubRole.findOne({ _id: data.roleId, hubId });
      if (!roleExists) {
        return { success: false, message: 'Role not found for this hub' };
      }
    }

    const updateData: any = { ...data };
    delete updateData.type;
    delete updateData.hubId;

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(data.password, salt);
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        (staff as any)[key] = updateData[key];
      }
    });

    await staff.save();

    const updated = await Staff.findById(staffId).populate('hubId', 'hubName city');

    if (updated && updated.roleId) {
      const roleData: any = await HubRole.findById(updated.roleId).select('roleName permissions').lean();
      if (roleData) {
        (updated as any).roleId = roleData;
      }
    }

    return { success: true, message: 'Staff updated successfully', data: updated };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

// Delete hub staff (must belong to this hub)
export const deleteHubStaff = async (hubId: string, staffId: string) => {
  try {
    if (!Types.ObjectId.isValid(staffId)) {
      return { success: false, message: 'Invalid staff ID' };
    }

    const staff = await Staff.findOneAndDelete({ _id: staffId, type: 'hub', hubId });
    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }

    return { success: true, message: 'Staff deleted successfully' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

// Update hub staff status
export const updateHubStaffStatus = async (hubId: string, staffId: string, status: 'Active' | 'Inactive') => {
  try {
    if (!Types.ObjectId.isValid(staffId)) {
      return { success: false, message: 'Invalid staff ID' };
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: staffId, type: 'hub', hubId },
      { status },
      { new: true }
    ).populate('hubId', 'hubName city');

    if (!staff) {
      return { success: false, message: 'Staff not found' };
    }

    return { success: true, message: 'Status updated successfully', data: staff };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
