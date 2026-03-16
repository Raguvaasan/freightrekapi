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
exports.customerIdParamSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const yup = __importStar(require("yup"));
exports.createCustomerSchema = yup.object({
    body: yup.object({
        name: yup
            .string()
            .required('Name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        email: yup
            .string()
            .required('Email is required')
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .trim(),
        address: yup
            .string()
            .max(500, 'Address must not exceed 500 characters')
            .trim()
            .optional(),
        city: yup
            .string()
            .max(100, 'City must not exceed 100 characters')
            .trim()
            .optional(),
        state: yup
            .string()
            .max(100, 'State must not exceed 100 characters')
            .trim()
            .optional(),
        pincode: yup
            .string()
            .matches(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits')
            .optional(),
        gstNumber: yup
            .string()
            .max(20, 'GST number must not exceed 20 characters')
            .trim()
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
});
exports.updateCustomerSchema = yup.object({
    params: yup.object({
        id: yup.string().required('Customer ID is required'),
    }),
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
        address: yup
            .string()
            .max(500, 'Address must not exceed 500 characters')
            .trim()
            .optional(),
        city: yup
            .string()
            .max(100, 'City must not exceed 100 characters')
            .trim()
            .optional(),
        state: yup
            .string()
            .max(100, 'State must not exceed 100 characters')
            .trim()
            .optional(),
        pincode: yup
            .string()
            .matches(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits')
            .optional(),
        gstNumber: yup
            .string()
            .max(20, 'GST number must not exceed 20 characters')
            .trim()
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
});
exports.customerIdParamSchema = yup.object({
    params: yup.object({
        id: yup.string().required('Customer ID is required'),
    }),
});
