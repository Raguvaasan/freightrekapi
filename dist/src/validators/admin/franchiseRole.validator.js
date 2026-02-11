"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFranchiseRoleSchema = exports.createFranchiseRoleSchema = exports.franchiseModulePermissionSchema = void 0;
const yup = __importStar(require("yup"));
exports.franchiseModulePermissionSchema = yup.object({
    module: yup
        .string()
        .trim()
        .required('Module name is required'),
    read: yup
        .boolean()
        .required('Read permission is required'),
    write: yup
        .boolean()
        .required('Write permission is required'),
    update: yup
        .boolean()
        .required('Update permission is required'),
    delete: yup
        .boolean()
        .required('Delete permission is required'),
});
exports.createFranchiseRoleSchema = yup.object({
    roleName: yup
        .string()
        .trim()
        .min(2, 'Role name must be at least 2 characters')
        .max(50, 'Role name must not exceed 50 characters')
        .required('Role name is required'),
    permissions: yup
        .array()
        .of(exports.franchiseModulePermissionSchema)
        .min(1, 'At least one module permission is required')
        .required('Permissions are required')
        .test('unique-modules', 'Duplicate module permissions are not allowed', (permissions) => {
        if (!permissions)
            return false;
        const modules = permissions.map(p => p.module);
        return new Set(modules).size === modules.length;
    }),
    status: yup
        .boolean()
        .optional(),
});
exports.updateFranchiseRoleSchema = exports.createFranchiseRoleSchema.shape({
    roleName: yup.string().min(2).max(50).optional(),
    permissions: yup.array().of(exports.franchiseModulePermissionSchema).optional(),
    status: yup.boolean().optional(),
});
