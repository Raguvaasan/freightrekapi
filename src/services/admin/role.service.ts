import { Role } from '../../models/admin/role.model'

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
    const roles = await Role.findById(id);
    return { success: true, data: roles };
  }
  catch (err: any) {
    return { success: false, message: err.message }
  }
};

export const updateRole = async (id: any, rb: any) => {
  try {

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
    return { success: false, data: err.message };
  }

};

export const deleteRole = async (id: any) => {
  try {
    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return { success: false, message: "Role not found" };
    }

    return { success: true, message: "Role deleted" }
  }
  catch (err: any) {
    return { success: false, data: err.message };
  }

};