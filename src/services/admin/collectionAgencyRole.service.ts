import { CollectionAgencyRole } from '../../models/admin/collectionAgencyRole.model';

export const createCollectionAgencyRole = async (collectionAgencyId: string, rb: any) => {
  try {
    const role = await CollectionAgencyRole.create({
      ...rb,
      collectionAgencyId,
    });
    return { success: true, data: role };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, message: 'Role name already exists for this collection agency' };
    }
    return { success: false, message: err.message };
  }
};

export const getCollectionAgencyRoles = async (collectionAgencyId: string) => {
  try {
    const roles = await CollectionAgencyRole.find({ collectionAgencyId });
    return { success: true, data: roles };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const getCollectionAgencyRoleById = async (collectionAgencyId: string, roleId: string) => {
  try {
    const role = await CollectionAgencyRole.findOne({ _id: roleId, collectionAgencyId });
    if (!role) {
      return { success: false, message: 'Role not found' };
    }
    return { success: true, data: role };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const updateCollectionAgencyRole = async (collectionAgencyId: string, roleId: string, rb: any) => {
  try {
    const role = await CollectionAgencyRole.findOneAndUpdate(
      { _id: roleId, collectionAgencyId },
      rb,
      { new: true }
    );

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    return { success: true, data: role };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, message: 'Role name already exists for this collection agency' };
    }
    return { success: false, message: err.message };
  }
};

export const deleteCollectionAgencyRole = async (collectionAgencyId: string, roleId: string) => {
  try {
    const role = await CollectionAgencyRole.findOneAndDelete({ _id: roleId, collectionAgencyId });

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    return { success: true, message: 'Role deleted successfully' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
