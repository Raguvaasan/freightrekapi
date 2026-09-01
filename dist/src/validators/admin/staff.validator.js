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
exports.staffVerifyOtpSchema = exports.staffSendOtpSchema = exports.staffLoginSchema = exports.deleteStaffSchema = exports.getStaffByIdSchema = exports.updateStaffStatusSchema = exports.updateStaffSchema = exports.createStaffSchema = void 0;
const yup = __importStar(require("yup"));
// Create staff validation schema
exports.createStaffSchema = yup.object({
    body: yup.object({
        name: yup
            .string()
            .required('Name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        // Optional: users are identified by phone, which is unique system-wide
        email: yup
            .string()
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim()
            .optional(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim(),
        type: yup
            .string()
            .required('Type is required')
            .oneOf(['head_quarter', 'franchise', 'hub'], 'Type must be head_quarter, franchise, or hub'),
        roleId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
        franchiseId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid franchise ID')
            .when('type', {
            is: 'franchise',
            then: (schema) => schema.required('Franchise is required for franchise staff'),
            otherwise: (schema) => schema.optional(),
        }),
        hubId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid hub ID')
            .when('type', {
            is: 'hub',
            then: (schema) => schema.required('Hub is required for hub staff'),
            otherwise: (schema) => schema.optional(),
        }),
        username: yup
            .string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username must not exceed 50 characters')
            .trim()
            .optional(),
        password: yup
            .string()
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must not exceed 100 characters')
            .optional(),
    }),
});
// Update staff validation schema
exports.updateStaffSchema = yup.object({
    body: yup.object({
        name: yup
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim()
            .optional(),
        email: yup
            .string()
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim()
            .optional(),
        phone: yup
            .string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim()
            .optional(),
        type: yup
            .string()
            .oneOf(['head_quarter', 'franchise', 'hub'], 'Type must be head_quarter, franchise, or hub')
            .optional(),
        roleId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
        franchiseId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid franchise ID')
            .optional(),
        hubId: yup
            .string()
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid hub ID')
            .optional(),
        username: yup
            .string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username must not exceed 50 characters')
            .trim()
            .optional(),
        password: yup
            .string()
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password must not exceed 100 characters')
            .optional(),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Staff ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
    }),
});
// Update staff status validation schema
exports.updateStaffStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Staff ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
    }),
});
// Get staff by ID validation schema
exports.getStaffByIdSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Staff ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
    }),
});
// Delete staff validation schema
exports.deleteStaffSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Staff ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
    }),
});
// Staff login validation schema
exports.staffLoginSchema = yup.object({
    body: yup.object({
        username: yup
            .string()
            .required('Username is required')
            .trim(),
        password: yup
            .string()
            .required('Password is required'),
    }),
});
// OTP Login - Send OTP
exports.staffSendOtpSchema = yup.object({
    body: yup.object({
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
            .trim(),
        countryCode: yup
            .string()
            .required('Country code is required')
            .trim(),
        type: yup
            .string()
            .oneOf(['franchise', 'hub', 'head_quarter'], 'Invalid staff type')
            .optional(),
    }),
});
// OTP Login - Verify OTP
exports.staffVerifyOtpSchema = yup.object({
    body: yup.object({
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
            .trim(),
        countryCode: yup
            .string()
            .required('Country code is required')
            .trim(),
        otp: yup
            .string()
            .required('OTP is required')
            .matches(/^[0-9]{6}$/, 'OTP must be 6 digits'),
        type: yup
            .string()
            .oneOf(['franchise', 'hub', 'head_quarter'], 'Invalid staff type')
            .optional(),
    }),
});
