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
exports.parcelOrderByIdSchema = exports.hubStatusSchema = exports.branchStatusSchema = exports.updateParcelStatusSchema = exports.updateChargeSchema = exports.assignVehicleDriverSchema = exports.assignHubSchema = exports.updateParcelOrderSchema = exports.branchCreateParcelOrderSchema = exports.createParcelOrderSchema = void 0;
const yup = __importStar(require("yup"));
const parcelOrder_model_1 = require("../../models/admin/parcelOrder.model");
const objectId = /^[0-9a-fA-F]{24}$/;
/** GST is optional everywhere; when given it must be a well-formed GSTIN */
const gstField = yup
    .string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
    .trim()
    .optional();
const addressField = yup
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .trim()
    .optional();
const waybillField = yup
    .string()
    .max(50, 'Waybill must not exceed 50 characters')
    .trim()
    .optional();
const vehicleTypeField = yup
    .string()
    .max(100, 'Vehicle type must not exceed 100 characters')
    .trim()
    .optional();
const vehicleCapacityField = yup
    .string()
    .max(50, 'Vehicle capacity must not exceed 50 characters')
    .trim()
    .optional();
const chargeOverrides = {
    loadingCharge: yup
        .number()
        .typeError('Loading charge must be a number')
        .min(0, 'Loading charge cannot be negative')
        .optional(),
    miscellaneousCharge: yup
        .number()
        .typeError('Miscellaneous charge must be a number')
        .min(0, 'Miscellaneous charge cannot be negative')
        .optional(),
};
const orderIdParam = yup.object({
    id: yup
        .string()
        .required('Order ID is required')
        .matches(objectId, 'Invalid order ID'),
});
// Booking fields shared by the admin and branch create endpoints
const bookingBody = {
    bookingCustomer: yup
        .object({
        name: yup
            .string()
            .required('Booking customer name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(100)
            .trim(),
        mobileNumber: yup
            .string()
            .required('Booking customer mobile number is required')
            .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
            .trim(),
        address: yup.string().max(500, 'Address must not exceed 500 characters').trim().optional(),
        gstNumber: gstField,
    })
        .required('Booking customer details are required'),
    paymentType: yup
        .string()
        .required('Payment type is required')
        .oneOf(parcelOrder_model_1.PAYMENT_TYPES, `Payment type must be one of: ${parcelOrder_model_1.PAYMENT_TYPES.join(', ')}`),
    deliveryCustomer: yup
        .object({
        name: yup
            .string()
            .required('Delivery customer name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(100)
            .trim(),
        mobileNumber: yup
            .string()
            .required('Delivery customer mobile number is required')
            .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
            .trim(),
        address: yup.string().max(500, 'Address must not exceed 500 characters').trim().optional(),
        gstNumber: gstField,
        // deliveryAgency is the current name; deliveryBranch is the deprecated one
        deliveryAgency: yup
            .string()
            .matches(objectId, 'Invalid delivery agency ID')
            .optional(),
        deliveryBranch: yup
            .string()
            .matches(objectId, 'Invalid delivery agency ID')
            .optional(),
    })
        .required('Delivery customer details are required'),
    // Where the parcel is collected from and dropped at
    pickupAddress: addressField,
    deliveryAddress: addressField,
    parcelDetails: yup
        .object({
        article: yup
            .string()
            .required('Article is required')
            .max(200)
            .trim(),
        remarks: yup.string().max(500).trim().optional(),
        numberOfParcels: yup
            .number()
            .typeError('Number of parcels must be a number')
            .required('Number of parcels is required')
            .integer('Number of parcels must be a whole number')
            .min(1, 'Number of parcels must be at least 1'),
        approximateValue: yup
            .number()
            .typeError('Approximate value must be a number')
            .min(0, 'Approximate value cannot be negative')
            .optional(),
    })
        .required('Parcel details are required'),
    transportationCharge: yup
        .number()
        .typeError('Transportation charge must be a number')
        .min(0, 'Transportation charge cannot be negative')
        .optional(),
    ...chargeOverrides,
    waybill: waybillField,
    vehicleType: vehicleTypeField,
    vehicleCapacity: vehicleCapacityField,
    vehicle: yup.string().matches(objectId, 'Invalid vehicle ID').optional(),
    driver: yup.string().matches(objectId, 'Invalid driver ID').optional(),
};
// Admin create: the booking branch must be stated explicitly
exports.createParcelOrderSchema = yup.object({
    body: yup
        .object({
        // agency is the current name; branch is still accepted
        agency: yup.string().matches(objectId, 'Invalid agency ID').optional(),
        branch: yup.string().matches(objectId, 'Invalid agency ID').optional(),
        ...bookingBody,
    })
        .test('agency-required', 'Agency is required', (value) => !!(value?.agency || value?.branch)),
});
// Branch create: the branch comes from the logged-in franchise token
exports.branchCreateParcelOrderSchema = yup.object({
    body: yup.object({
        ...bookingBody,
    }),
});
// Update parcel order (booking details) validation schema
exports.updateParcelOrderSchema = yup.object({
    body: yup.object({
        agency: yup.string().matches(objectId, 'Invalid agency ID').optional(),
        branch: yup.string().matches(objectId, 'Invalid agency ID').optional(),
        bookingCustomer: yup
            .object({
            name: yup.string().min(2).max(100).trim().optional(),
            mobileNumber: yup
                .string()
                .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
                .trim()
                .optional(),
            address: yup.string().max(500).trim().optional(),
            gstNumber: gstField,
        })
            .optional(),
        paymentType: yup
            .string()
            .oneOf(parcelOrder_model_1.PAYMENT_TYPES, `Payment type must be one of: ${parcelOrder_model_1.PAYMENT_TYPES.join(', ')}`)
            .optional(),
        deliveryCustomer: yup
            .object({
            name: yup.string().min(2).max(100).trim().optional(),
            mobileNumber: yup
                .string()
                .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
                .trim()
                .optional(),
            address: yup.string().max(500).trim().optional(),
            gstNumber: gstField,
            deliveryAgency: yup
                .string()
                .matches(objectId, 'Invalid delivery agency ID')
                .optional(),
            deliveryBranch: yup
                .string()
                .matches(objectId, 'Invalid delivery agency ID')
                .optional(),
        })
            .optional(),
        pickupAddress: addressField,
        deliveryAddress: addressField,
        parcelDetails: yup
            .object({
            article: yup.string().max(200).trim().optional(),
            remarks: yup.string().max(500).trim().optional(),
            numberOfParcels: yup
                .number()
                .typeError('Number of parcels must be a number')
                .integer('Number of parcels must be a whole number')
                .min(1, 'Number of parcels must be at least 1')
                .optional(),
            approximateValue: yup
                .number()
                .typeError('Approximate value must be a number')
                .min(0, 'Approximate value cannot be negative')
                .optional(),
        })
            .optional(),
        waybill: waybillField,
        vehicleType: vehicleTypeField,
        vehicleCapacity: vehicleCapacityField,
        vehicle: yup.string().matches(objectId, 'Invalid vehicle ID').optional(),
        driver: yup.string().matches(objectId, 'Invalid driver ID').optional(),
    }),
    params: orderIdParam,
});
// Admin assigns a hub to a branch booking
exports.assignHubSchema = yup.object({
    body: yup.object({
        hub: yup
            .string()
            .required('Hub is required')
            .matches(objectId, 'Invalid hub ID'),
        note: yup.string().max(500).trim().optional(),
    }),
    params: orderIdParam,
});
// Hub (or admin) assigns the vehicle + driver.
// Either field may be sent alone; an empty string / null clears it.
exports.assignVehicleDriverSchema = yup.object({
    body: yup
        .object({
        vehicle: yup
            .string()
            .nullable()
            .test('vehicle-objectid', 'Invalid vehicle ID', (value) => value === undefined || value === null || value === '' || objectId.test(value)),
        driver: yup
            .string()
            .nullable()
            .test('driver-objectid', 'Invalid driver ID', (value) => value === undefined || value === null || value === '' || objectId.test(value)),
        note: yup.string().max(500).trim().optional(),
    })
        .test('vehicle-or-driver', 'Provide a vehicle and/or a driver', (body) => body?.vehicle !== undefined || body?.driver !== undefined),
    params: orderIdParam,
});
// Update transportation charge validation schema
exports.updateChargeSchema = yup.object({
    body: yup.object({
        transportationCharge: yup
            .number()
            .typeError('Transportation charge must be a number')
            .required('Transportation charge is required')
            .min(0, 'Transportation charge cannot be negative'),
        ...chargeOverrides,
    }),
    params: orderIdParam,
});
// Update parcel status validation schema (admin - any lifecycle status)
exports.updateParcelStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(parcelOrder_model_1.PARCEL_STATUSES, `Status must be one of: ${parcelOrder_model_1.PARCEL_STATUSES.join(', ')}`),
        note: yup.string().max(500).trim().optional(),
    }),
    params: orderIdParam,
});
// Branch status update - only the branch-side stages
exports.branchStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(parcelOrder_model_1.AGENCY_ALLOWED_STATUSES, `An agency can set only: ${parcelOrder_model_1.AGENCY_ALLOWED_STATUSES.join(', ')}`),
        note: yup.string().max(500).trim().optional(),
    }),
    params: orderIdParam,
});
// Hub status update - only the hub-side stages
exports.hubStatusSchema = yup.object({
    body: yup.object({
        status: yup
            .string()
            .required('Status is required')
            .oneOf(parcelOrder_model_1.HUB_ALLOWED_STATUSES, `A hub can set only: ${parcelOrder_model_1.HUB_ALLOWED_STATUSES.join(', ')}`),
        note: yup.string().max(500).trim().optional(),
    }),
    params: orderIdParam,
});
// Get / delete by ID validation schema
exports.parcelOrderByIdSchema = yup.object({
    params: orderIdParam,
});
