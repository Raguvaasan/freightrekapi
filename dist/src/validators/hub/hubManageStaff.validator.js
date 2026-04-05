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
exports.updateHubStaffSchema = exports.createHubStaffSchema = void 0;
const yup = __importStar(require("yup"));
exports.createHubStaffSchema = yup.object({
    body: yup.object({
        name: yup.string().required('Name is required').min(2).max(100).trim(),
        email: yup.string().required('Email is required').email('Invalid email format').max(100).trim(),
        phone: yup
            .string()
            .required('Phone number is required')
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
        roleId: yup.string().matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID').optional(),
        status: yup.string().oneOf(['Active', 'Inactive']).optional(),
        username: yup.string().required('Username is required').min(3).max(50).trim(),
        password: yup.string().required('Password is required').min(6).max(100),
    }),
});
exports.updateHubStaffSchema = yup.object({
    body: yup.object({
        name: yup.string().min(2).max(100).trim().optional(),
        email: yup.string().email('Invalid email format').max(100).optional(),
        phone: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional(),
        roleId: yup.string().matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID').optional(),
        status: yup.string().oneOf(['Active', 'Inactive']).optional(),
        username: yup.string().min(3).max(50).trim().optional(),
        password: yup.string().min(6).max(100).optional(),
    }),
});
