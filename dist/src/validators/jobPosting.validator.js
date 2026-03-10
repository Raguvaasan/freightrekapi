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
exports.updateJobPostingSchema = exports.createJobPostingSchema = void 0;
const yup = __importStar(require("yup"));
exports.createJobPostingSchema = yup.object({
    title: yup.string().required('Job title is required').trim(),
    experience: yup.string().required('Experience is required').trim(),
    qualification: yup.string().required('Qualification is required').trim(),
    shortDesc: yup.string().required('Short description is required').trim(),
    description: yup
        .array()
        .of(yup.string().trim())
        .required('Description is required')
        .min(1, 'At least one description point is required'),
    skills: yup
        .array()
        .of(yup.string().trim())
        .required('Skills are required')
        .min(1, 'At least one skill is required')
});
exports.updateJobPostingSchema = yup.object({
    title: yup.string().optional().trim(),
    experience: yup.string().optional().trim(),
    qualification: yup.string().optional().trim(),
    shortDesc: yup.string().optional().trim(),
    description: yup
        .array()
        .of(yup.string().trim())
        .optional(),
    skills: yup
        .array()
        .of(yup.string().trim())
        .optional(),
    isActive: yup.boolean().optional()
});
