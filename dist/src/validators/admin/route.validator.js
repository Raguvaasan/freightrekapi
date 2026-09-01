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
exports.deleteRouteSchema = exports.getRouteByIdSchema = exports.updateRouteStatusSchema = exports.updateRouteBranchesSchema = exports.updateRouteSchema = exports.createRouteSchema = void 0;
const yup = __importStar(require("yup"));
const objectId = /^[0-9a-fA-F]{24}$/;
// Create route validation schema
exports.createRouteSchema = yup.object({
    body: yup.object({
        routeName: yup
            .string()
            .required('Route name is required')
            .min(2, 'Route name must be at least 2 characters')
            .max(150, 'Route name must not exceed 150 characters')
            .trim(),
        from: yup
            .string()
            .required('Origin location is required')
            .min(2, 'Origin location must be at least 2 characters')
            .max(150, 'Origin location must not exceed 150 characters')
            .trim(),
        to: yup
            .string()
            .required('Destination location is required')
            .min(2, 'Destination location must be at least 2 characters')
            .max(150, 'Destination location must not exceed 150 characters')
            .trim(),
        branches: yup
            .array()
            .of(yup.string().trim().min(1, 'Branch name cannot be empty'))
            .optional(),
        transportationCharge: yup
            .number()
            .typeError('Transportation charge must be a number')
            .min(0, 'Transportation charge cannot be negative')
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
});
// Update route validation schema
exports.updateRouteSchema = yup.object({
    body: yup.object({
        routeName: yup
            .string()
            .min(2, 'Route name must be at least 2 characters')
            .max(150, 'Route name must not exceed 150 characters')
            .trim()
            .optional(),
        from: yup
            .string()
            .min(2, 'Origin location must be at least 2 characters')
            .max(150, 'Origin location must not exceed 150 characters')
            .trim()
            .optional(),
        to: yup
            .string()
            .min(2, 'Destination location must be at least 2 characters')
            .max(150, 'Destination location must not exceed 150 characters')
            .trim()
            .optional(),
        branches: yup
            .array()
            .of(yup.string().trim().min(1, 'Branch name cannot be empty'))
            .optional(),
        transportationCharge: yup
            .number()
            .typeError('Transportation charge must be a number')
            .min(0, 'Transportation charge cannot be negative')
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Route ID is required')
            .matches(objectId, 'Invalid route ID'),
    }),
});
// Update route branches validation schema (Branch Management)
exports.updateRouteBranchesSchema = yup.object({
    body: yup.object({
        branches: yup
            .array()
            .of(yup.string().trim().min(1, 'Branch name cannot be empty'))
            .required('Branches list is required'),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Route ID is required')
            .matches(objectId, 'Invalid route ID'),
    }),
});
// Update route status validation schema
exports.updateRouteStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Route ID is required')
            .matches(objectId, 'Invalid route ID'),
    }),
});
// Get route by ID validation schema
exports.getRouteByIdSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Route ID is required')
            .matches(objectId, 'Invalid route ID'),
    }),
});
// Delete route validation schema
exports.deleteRouteSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Route ID is required')
            .matches(objectId, 'Invalid route ID'),
    }),
});
