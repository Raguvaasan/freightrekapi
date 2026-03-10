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
exports.updateCareerApplicationSchema = exports.createCareerApplicationSchema = void 0;
const yup = __importStar(require("yup"));
exports.createCareerApplicationSchema = yup.object({
    jobPostingId: yup
        .string()
        .required('Job posting ID is required')
        .matches(/^[0-9a-fA-F]{24}$/, 'Invalid job posting ID'),
    name: yup
        .string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim(),
    phone: yup
        .string()
        .required('Phone number is required')
        .matches(/^[0-9\-\+\s\(\)]+$/, 'Invalid phone number format')
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number must not exceed 15 characters')
        .trim(),
    email: yup
        .string()
        .email('Invalid email address')
        .required('Email is required')
        .trim()
        .lowercase(),
    coveringMessage: yup
        .string()
        .required('Covering message is required')
        .min(10, 'Covering message must be at least 10 characters')
        .max(2000, 'Covering message must not exceed 2000 characters')
        .trim(),
    resumePath: yup
        .string()
        .required('Resume file path is required')
        .trim()
});
exports.updateCareerApplicationSchema = yup.object({
    name: yup
        .string()
        .optional()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim(),
    phone: yup
        .string()
        .optional()
        .matches(/^[0-9\-\+\s\(\)]+$/, 'Invalid phone number format')
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number must not exceed 15 characters')
        .trim(),
    email: yup
        .string()
        .email('Invalid email address')
        .optional()
        .trim()
        .lowercase(),
    coveringMessage: yup
        .string()
        .optional()
        .min(10, 'Covering message must be at least 10 characters')
        .max(2000, 'Covering message must not exceed 2000 characters')
        .trim(),
    status: yup
        .string()
        .oneOf(['pending', 'reviewed', 'rejected', 'accepted'], 'Invalid status')
        .optional()
});
