import { Types } from 'mongoose'
import { Role } from '../../models/admin/role.model'

/** A malformed id must read as "invalid id", not as a Mongoose cast failure */
const invalidId = (id: any) => !id || !Types.ObjectId.isValid(id);

export const createRole = async (rb: any) => {
  try {
    const role = await Role.create(rb);
    return { success: true, data: role }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
};


export const getRoles = async () => {
  try {
    const roles = await Role.find();
    return { success: true, data: roles };
  }
  catch (err: any) {
    return { success: false, message: err.message }
  }
};


export const getRolesById = async (id: any) => {
  try {
    if (invalidId(id)) {
      return { success: false, message: "Invalid role ID" };
    }

    const role = await Role.findById(id);

    if (!role) {
      return { success: false, message: "Role not found" };
    }

    return { success: true, data: role };
  }
  catch (err: any) {
    return { success: false, message: err.message }
  }
};

export const updateRole = async (id: any, rb: any) => {
  try {
    if (invalidId(id)) {
      return { success: false, message: "Invalid role ID" };
    }

    const role = await Role.findByIdAndUpdate(
      id,
      rb,
      { new: true }
    );

    if (!role) {
      return { success: false, message: "Role not found" };
    }

    return { success: true, data: role };

  }
  catch (err: any) {
    return { success: false, message: err.message };
  }

};

export const deleteRole = async (id: any) => {
  try {
    if (invalidId(id)) {
      return { success: false, message: "Invalid role ID" };
    }

    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return { success: false, message: "Role not found" };
    }

    return { success: true, message: "Role deleted" }
  }
  catch (err: any) {
    return { success: false, message: err.message };
  }

};
