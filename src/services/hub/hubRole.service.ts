import { HubRole } from '../../models/hub/hubRole.model';

export const createHubRole = async (hubId: string, rb: any) => {
  try {
    const role = await HubRole.create({
      ...rb,
      hubId,
    });
    return { success: true, data: role };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, message: 'Role name already exists for this hub' };
    }
    return { success: false, message: err.message };
  }
};

export const getHubRoles = async (hubId: string) => {
  try {
    const roles = await HubRole.find({ hubId });
    return { success: true, data: roles };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const getHubRoleById = async (hubId: string, roleId: string) => {
  try {
    const role = await HubRole.findOne({ _id: roleId, hubId });
    if (!role) {
      return { success: false, message: 'Role not found' };
    }
    return { success: true, data: role };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const updateHubRole = async (hubId: string, roleId: string, rb: any) => {
  try {
    const role = await HubRole.findOneAndUpdate(
      { _id: roleId, hubId },
      rb,
      { new: true }
    );

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    return { success: true, data: role };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, message: 'Role name already exists for this hub' };
    }
    return { success: false, message: err.message };
  }
};

export const deleteHubRole = async (hubId: string, roleId: string) => {
  try {
    const role = await HubRole.findOneAndDelete({ _id: roleId, hubId });

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    return { success: true, message: 'Role deleted successfully' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
