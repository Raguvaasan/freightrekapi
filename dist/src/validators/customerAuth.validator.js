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
exports.verifyOtpSchema = exports.sendOtpSchema = exports.customerRegisterSchema = void 0;
const yup = __importStar(require("yup"));
exports.customerRegisterSchema = yup.object({
    body: yup.object({
        firstName: yup
            .string()
            .required('First name is required')
            .min(2, 'First name must be at least 2 characters')
            .max(50, 'First name must not exceed 50 characters')
            .trim(),
        lastName: yup
            .string()
            .required('Last name is required')
            .min(2, 'Last name must be at least 2 characters')
            .max(50, 'Last name must not exceed 50 characters')
            .trim(),
        countryCode: yup
            .string()
            .required('Country code is required')
            .matches(/^\+\d{1,4}$/, 'Country code must be in format +1 to +9999')
            .trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^\d{7,15}$/, 'Phone number must be 7–15 digits')
            .trim(),
        email: yup
            .string()
            .required('Email is required')
            .email('Invalid email format')
            .max(100, 'Email must not exceed 100 characters')
            .trim(),
    }),
});
exports.sendOtpSchema = yup.object({
    body: yup.object({
        countryCode: yup
            .string()
            .required('Country code is required')
            .matches(/^\+\d{1,4}$/, 'Country code must be in format +1 to +9999')
            .trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^\d{7,15}$/, 'Phone number must be 7–15 digits')
            .trim(),
    }),
});
exports.verifyOtpSchema = yup.object({
    body: yup.object({
        countryCode: yup
            .string()
            .required('Country code is required')
            .matches(/^\+\d{1,4}$/, 'Country code must be in format +1 to +9999')
            .trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^\d{7,15}$/, 'Phone number must be 7–15 digits')
            .trim(),
        otp: yup
            .string()
            .required('OTP is required')
            .matches(/^\d{6}$/, 'OTP must be exactly 6 digits'),
    }),
});
