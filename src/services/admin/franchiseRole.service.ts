import { FranchiseRole } from '../../models/admin/franchiseRole.model';

export const createFranchiseRole = async (franchiseId: string, rb: any) => {
  try {
    const role = await FranchiseRole.create({
      ...rb,
      franchiseId
    });
    return { success: true, data: role };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, message: 'Role name already exists for this franchise' };
    }
    return { success: false, message: err.message };
  }
};

export const getFranchiseRoles = async (franchiseId: string) => {
  try {
    const roles = await FranchiseRole.find({ franchiseId });
    return { success: true, data: roles };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const getFranchiseRoleById = async (franchiseId: string, roleId: string) => {
  try {
    const role = await FranchiseRole.findOne({ _id: roleId, franchiseId });
    if (!role) {
      return { success: false, message: 'Role not found' };
    }
    return { success: true, data: role };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const updateFranchiseRole = async (franchiseId: string, roleId: string, rb: any) => {
  try {
    const role = await FranchiseRole.findOneAndUpdate(
      { _id: roleId, franchiseId },
      rb,
      { new: true }
    );

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    return { success: true, data: role };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, message: 'Role name already exists for this franchise' };
    }
    return { success: false, message: err.message };
  }
};

export const deleteFranchiseRole = async (franchiseId: string, roleId: string) => {
  try {
    const role = await FranchiseRole.findOneAndDelete({ _id: roleId, franchiseId });

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    return { success: true, message: 'Role deleted successfully' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
