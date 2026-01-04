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
exports.getAgenciesByHubSchema = exports.deleteAgencySchema = exports.getAgencyByIdSchema = exports.updateAgencyStatusSchema = exports.updateAgencySchema = exports.createAgencySchema = void 0;
const yup = __importStar(require("yup"));
// Create agency validation schema
exports.createAgencySchema = yup.object({
    body: yup.object({
        agencyName: yup
            .string()
            .required('Agency name is required')
            .min(2, 'Agency name must be at least 2 characters')
            .max(100, 'Agency name must not exceed 100 characters')
            .trim(),
        agencyOwner: yup
            .string()
            .required('Agency owner is required')
            .min(2, 'Agency owner name must be at least 2 characters')
            .max(100, 'Agency owner name must not exceed 100 characters')
            .trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
        agencyType: yup
            .string()
            .max(50, 'Agency type must not exceed 50 characters')
            .trim()
            .optional(),
        email: yup
            .string()
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim()
            .optional(),
        address: yup
            .string()
            .max(500, 'Address must not exceed 500 characters')
            .trim()
            .optional(),
        gstNumber: yup
            .string()
            .max(30, 'GST number must not exceed 30 characters')
            .trim()
            .optional(),
    }),
});
// Update agency validation schema
exports.updateAgencySchema = yup.object({
    body: yup.object({
        agencyName: yup
            .string()
            .min(2, 'Agency name must be at least 2 characters')
            .max(100, 'Agency name must not exceed 100 characters')
            .trim()
            .optional(),
        agencyOwner: yup
            .string()
            .min(2, 'Agency owner name must be at least 2 characters')
            .max(100, 'Agency owner name must not exceed 100 characters')
            .trim()
            .optional(),
        phone: yup
            .string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim()
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
        agencyType: yup
            .string()
            .max(50, 'Agency type must not exceed 50 characters')
            .trim()
            .optional(),
        email: yup
            .string()
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim()
            .optional(),
        address: yup
            .string()
            .max(500, 'Address must not exceed 500 characters')
            .trim()
            .optional(),
        gstNumber: yup
            .string()
            .max(30, 'GST number must not exceed 30 characters')
            .trim()
            .optional(),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Agency ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
    }),
});
// Update agency status validation schema
exports.updateAgencyStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Agency ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
    }),
});
// Get agency by ID validation schema
exports.getAgencyByIdSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Agency ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
    }),
});
// Delete agency validation schema
exports.deleteAgencySchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Agency ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
    }),
});
// Get agencies by hub validation schema
exports.getAgenciesByHubSchema = yup.object({
    params: yup.object({
        hubId: yup
            .string()
            .required('Hub ID is required')
            .matches(/^[0-9a-fA-F]{24}$/, 'Invalid hub ID'),
    }),
});
