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
exports.updateLtlShipmentSchema = exports.getLtlShipmentsSchema = exports.createLtlShipmentSchema = void 0;
const yup = __importStar(require("yup"));
const dropoffLocationSchema = yup.object().shape({
    consignee_name: yup.string().required('Consignee name is required'),
    address: yup.string().required('Dropoff address is required'),
    city: yup.string().required('Dropoff city is required'),
    state: yup.string().required('Dropoff state is required'),
    zip: yup.string().required('Dropoff zip is required').matches(/^\d{6}$/, 'ZIP must be 6 digits'),
    phone: yup.string().required('Dropoff phone is required').matches(/^\d{10}$/, 'Phone must be 10 digits'),
    email: yup.string().email('Invalid email'),
});
const invoiceSchema = yup.object().shape({
    ewaybill: yup.string(),
    inv_num: yup.string().required('Invoice number is required'),
    inv_amt: yup.number().required('Invoice amount is required').positive('Invoice amount must be positive'),
    inv_qr_code: yup.string(),
});
const shipmentDetailSchema = yup.object().shape({
    order_id: yup.string().required('Order ID is required in shipment details'),
    box_count: yup.number().required('Box count is required').min(1, 'Box count must be at least 1'),
    description: yup.string(),
    weight: yup.number().required('Weight is required in shipment details').positive('Weight must be positive'),
    waybills: yup.array().of(yup.string()),
    master: yup.boolean().default(false),
});
const docDataSchema = yup.object().shape({
    doc_type: yup.string().required('Document type is required'),
    doc_meta: yup.mixed(),
});
const billingAddressSchema = yup.object().shape({
    name: yup.string().required('Billing name is required'),
    company: yup.string().required('Company name is required'),
    consignor: yup.string().required('Consignor is required'),
    address: yup.string().required('Billing address is required'),
    city: yup.string().required('Billing city is required'),
    state: yup.string().required('Billing state is required'),
    pin: yup.string().required('Billing PIN is required').matches(/^\d{6}$/, 'PIN must be 6 digits'),
    phone: yup.string().required('Billing phone is required').matches(/^\d{10}$/, 'Phone must be 10 digits'),
    pan_number: yup.string(),
    gst_number: yup.string(),
}).test('pan-or-gst', 'Either PAN number or GST number is required', (value) => !!(value?.pan_number || value?.gst_number));
exports.createLtlShipmentSchema = yup.object().shape({
    pickup_location_name: yup.string().required('Pickup location name is required'),
    payment_mode: yup.string().oneOf(['cod', 'prepaid'], 'Payment mode must be cod or prepaid').required('Payment mode is required'),
    cod_amount: yup.number().when('payment_mode', {
        is: 'cod',
        then: (schema) => schema.required('COD amount is required for COD orders').positive('COD amount must be positive'),
        otherwise: (schema) => schema.optional(),
    }),
    weight: yup.number().required('Weight is required').positive('Weight must be positive'),
    dropoff_location: dropoffLocationSchema.required('Dropoff location is required'),
    rov_insurance: yup.boolean().default(false),
    invoices: yup.array().of(invoiceSchema).min(1, 'At least one invoice is required'),
    shipment_details: yup.array().of(shipmentDetailSchema).required('Shipment details are required').min(1, 'At least one shipment detail is required'),
    doc_data: yup.array().of(docDataSchema).optional(),
    doc_file: yup.string().optional(),
    fm_pickup: yup.boolean().default(false),
    freight_mode: yup.string().required('Freight mode is required'),
    billing_address: billingAddressSchema.required('Billing address is required'),
    lrn: yup.string().optional(),
    // Existing system fields
    orderType: yup.string().oneOf(['hub', 'customer', 'b2b'], 'Order type must be hub, customer or b2b').optional(),
    baseAmount: yup.number().optional(),
    markupAmount: yup.number().optional(),
    markupType: yup.string().oneOf(['percentage', 'fixed']).optional(),
    markupValue: yup.number().optional(),
    totalAmount: yup.number().optional(),
    assignedStaffId: yup.string().optional(),
});
exports.getLtlShipmentsSchema = yup.object().shape({
    page: yup.number().min(1, 'Page must be at least 1'),
    limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
    status: yup.string().oneOf(['pending', 'created', 'Active', 'in_transit', 'delivered', 'failed', 'cancelled'], 'Invalid status'),
});
exports.updateLtlShipmentSchema = yup.object().shape({
    pickup_location_name: yup.string(),
    payment_mode: yup.string().oneOf(['cod', 'prepaid']),
    cod_amount: yup.number().positive(),
    weight: yup.number().positive(),
    dropoff_location: yup.object().shape({
        consignee_name: yup.string(),
        address: yup.string(),
        city: yup.string(),
        state: yup.string(),
        zip: yup.string().matches(/^\d{6}$/, 'ZIP must be 6 digits'),
        phone: yup.string().matches(/^\d{10}$/, 'Phone must be 10 digits'),
        email: yup.string().email(),
    }).optional(),
    rov_insurance: yup.boolean(),
    invoices: yup.array().of(invoiceSchema),
    shipment_details: yup.array().of(shipmentDetailSchema),
    doc_data: yup.array().of(docDataSchema),
    doc_file: yup.string(),
    fm_pickup: yup.boolean(),
    freight_mode: yup.string(),
    billing_address: yup.object().shape({
        name: yup.string(),
        company: yup.string(),
        consignor: yup.string(),
        address: yup.string(),
        city: yup.string(),
        state: yup.string(),
        pin: yup.string().matches(/^\d{6}$/, 'PIN must be 6 digits'),
        phone: yup.string().matches(/^\d{10}$/, 'Phone must be 10 digits'),
        pan_number: yup.string(),
        gst_number: yup.string(),
    }).optional(),
    status: yup.string().oneOf(['pending', 'created', 'Active', 'in_transit', 'delivered', 'failed', 'cancelled'], 'Invalid status'),
    baseAmount: yup.number(),
    markupAmount: yup.number(),
    markupType: yup.string().oneOf(['percentage', 'fixed']),
    markupValue: yup.number(),
    totalAmount: yup.number(),
});
