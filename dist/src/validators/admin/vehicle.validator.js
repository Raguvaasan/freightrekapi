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
exports.deleteVehicleSchema = exports.getVehicleByIdSchema = exports.updateVehicleStatusSchema = exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const yup = __importStar(require("yup"));
const objectId = /^[0-9a-fA-F]{24}$/;
// Create vehicle validation schema
exports.createVehicleSchema = yup.object({
    body: yup.object({
        vehicleType: yup
            .string()
            .required('Vehicle type is required')
            .min(2, 'Vehicle type must be at least 2 characters')
            .max(100, 'Vehicle type must not exceed 100 characters')
            .trim(),
        capacity: yup
            .string()
            .required('Capacity is required')
            .max(50, 'Capacity must not exceed 50 characters')
            .trim(),
        vehicleRegistrationNumber: yup
            .string()
            .required('Vehicle registration number is required')
            .min(4, 'Vehicle registration number must be at least 4 characters')
            .max(20, 'Vehicle registration number must not exceed 20 characters')
            .trim(),
        rcNumber: yup
            .string()
            .required('RC number is required')
            .max(50, 'RC number must not exceed 50 characters')
            .trim(),
        insuranceNumber: yup
            .string()
            .required('Insurance number is required')
            .max(50, 'Insurance number must not exceed 50 characters')
            .trim(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
});
// Update vehicle validation schema
exports.updateVehicleSchema = yup.object({
    body: yup.object({
        vehicleType: yup
            .string()
            .min(2, 'Vehicle type must be at least 2 characters')
            .max(100, 'Vehicle type must not exceed 100 characters')
            .trim()
            .optional(),
        capacity: yup
            .string()
            .max(50, 'Capacity must not exceed 50 characters')
            .trim()
            .optional(),
        vehicleRegistrationNumber: yup
            .string()
            .min(4, 'Vehicle registration number must be at least 4 characters')
            .max(20, 'Vehicle registration number must not exceed 20 characters')
            .trim()
            .optional(),
        rcNumber: yup
            .string()
            .max(50, 'RC number must not exceed 50 characters')
            .trim()
            .optional(),
        insuranceNumber: yup
            .string()
            .max(50, 'Insurance number must not exceed 50 characters')
            .trim()
            .optional(),
        status: yup
            .string()
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
            .optional(),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Vehicle ID is required')
            .matches(objectId, 'Invalid vehicle ID'),
    }),
});
// Update vehicle status validation schema
exports.updateVehicleStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
    }),
    params: yup.object({
        id: yup
            .string()
            .required('Vehicle ID is required')
            .matches(objectId, 'Invalid vehicle ID'),
    }),
});
// Get vehicle by ID validation schema
exports.getVehicleByIdSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Vehicle ID is required')
            .matches(objectId, 'Invalid vehicle ID'),
    }),
});
// Delete vehicle validation schema
exports.deleteVehicleSchema = yup.object({
    params: yup.object({
        id: yup
            .string()
            .required('Vehicle ID is required')
            .matches(objectId, 'Invalid vehicle ID'),
    }),
});
