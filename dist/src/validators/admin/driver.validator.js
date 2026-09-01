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
exports.deleteDriverSchema = exports.getDriverByIdSchema = exports.updateDriverStatusSchema = exports.updateDriverSchema = exports.createDriverSchema = void 0;
const yup = __importStar(require("yup"));
const objectId = /^[0-9a-fA-F]{24}$/;
// Create driver validation schema
exports.createDriverSchema = yup.object({
    body: yup.object({
        driverName: yup
            .string()
            .required('Driver name is required')
            .min(2, 'Driver name must be at least 2 characters')
            .max(100, 'Driver name must not exceed 100 characters')
            .trim(),
        phoneNumber: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim(),
        licenseNumber: yup
            .string()
            .required('License number is required')
            .min(4, 'License number must be at least 4 characters')
            .max(30, 'License number must not exceed 30 characters')
            .trim(),
        dateOfExpiry: yup
            .date()
            .typeError('Date of expiry must be a valid date')
            .required('Date of expiry is required'),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
});
// Update driver validation schema
exports.updateDriverSchema = yup.object({
    body: yup.object({
        driverName: yup
            .string()
            .min(2, 'Driver name must be at least 2 characters')
            .max(100, 'Driver name must not exceed 100 characters')
            .trim()
            .optional(),
        phoneNumber: yup
            .string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim()
            .optional(),
        licenseNumber: yup
            .string()
            .min(4, 'License number must be at least 4 characters')
            .max(30, 'License number must not exceed 30 characters')
            .trim()
            .optional(),
        dateOfExpiry: yup
            .date()
            .typeError('Date of expiry must be a valid date')
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Driver ID is required')
            .matches(objectId, 'Invalid driver ID'),
    }),
});
// Update driver status validation schema
exports.updateDriverStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Driver ID is required')
            .matches(objectId, 'Invalid driver ID'),
    }),
});
// Get driver by ID validation schema
exports.getDriverByIdSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Driver ID is required')
            .matches(objectId, 'Invalid driver ID'),
    }),
});
// Delete driver validation schema
exports.deleteDriverSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Driver ID is required')
            .matches(objectId, 'Invalid driver ID'),
    }),
});
