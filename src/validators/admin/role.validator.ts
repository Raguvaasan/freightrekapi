import * as yup from "yup";

export const modulePermissionSchema = yup.object({
  module: yup
    .string()
    .trim()
    .required("Module name is required"),

  read: yup
    .boolean()
    .required("Read permission is required"),

  write: yup
    .boolean()
    .required("Write permission is required"),

  update: yup
    .boolean()
    .required("Update permission is required"),

  delete: yup
    .boolean()
    .required("Delete permission is required"),
});


export const createRoleSchema = yup.object({
  roleName: yup
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must not exceed 50 characters")
    .required("Role name is required"),

  permissions: yup
    .array()
    .of(modulePermissionSchema)
    .min(1, "At least one module permission is required")
    .required("Permissions are required")
    .test(
      "unique-modules",
      "Duplicate module permissions are not allowed",
      (permissions) => {
        if (!permissions) return false;
        const modules = permissions.map(p => p.module);
        return new Set(modules).size === modules.length;
      }
    ),

  status: yup
    .boolean()
    .optional(),
});

export const updateRoleSchema = createRoleSchema.shape({
  roleName: yup.string().min(2).optional(),
  permissions: yup.array().of(modulePermissionSchema).optional(),
  status: yup.boolean().optional(),
});