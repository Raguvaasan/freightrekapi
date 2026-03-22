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
exports.updateShipmentSchema = exports.getShipmentsSchema = exports.createShipmentSchema = void 0;
const yup = __importStar(require("yup"));
exports.createShipmentSchema = yup.object().shape({
    name: yup.string().required('Consignee name is required'),
    add: yup.string().required('Address is required'),
    pin: yup
        .string()
        .required('PIN code is required')
        .matches(/^\d{6}$/, 'PIN code must be 6 digits'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().default('India'),
    phone: yup
        .string()
        .required('Phone number is required')
        .matches(/^\d{10}$/, 'Phone number must be 10 digits'),
    order: yup.string().required('Order reference is required'),
    paymentMode: yup
        .string()
        .required('Payment mode is required')
        .oneOf(['Prepaid', 'COD'], 'Payment mode must be Prepaid or COD'),
    fromName: yup.string(),
    fromAdd: yup.string(),
    fromPin: yup.string().matches(/^\d{6}$/, 'From PIN code must be 6 digits'),
    fromCity: yup.string(),
    fromState: yup.string(),
    fromCountry: yup.string(),
    fromPhone: yup.string().matches(/^\d{10}$/, 'From phone number must be 10 digits'),
    returnPin: yup.string(),
    returnCity: yup.string(),
    returnPhone: yup.string(),
    returnAdd: yup.string(),
    returnState: yup.string(),
    returnCountry: yup.string(),
    productsDesc: yup.string(),
    hsnCode: yup.string(),
    codAmount: yup.string(),
    orderDate: yup.date(),
    totalAmount: yup.string(),
    sellerAdd: yup.string(),
    sellerName: yup.string(),
    sellerInv: yup.string(),
    quantity: yup.string(),
    waybill: yup.string(),
    shipmentWidth: yup.string(),
    shipmentHeight: yup.string(),
    weight: yup.string(),
    shippingMode: yup
        .string()
        .oneOf(['Surface', 'Express'], 'Shipping mode must be Surface or Express')
        .default('Surface'),
    addressType: yup.string(),
    pickupLocation: yup.object().shape({
        name: yup.string().optional(),
    }).optional(),
});
exports.getShipmentsSchema = yup.object().shape({
    page: yup.number().min(1, 'Page must be at least 1'),
    limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
    status: yup
        .string()
        .oneOf(['pending', 'created', 'in_transit', 'delivered', 'failed', 'cancelled'], 'Invalid status'),
});
exports.updateShipmentSchema = yup.object().shape({
    name: yup.string(),
    add: yup.string(),
    pin: yup.string().matches(/^\d{6}$/, 'PIN code must be 6 digits'),
    city: yup.string(),
    state: yup.string(),
    country: yup.string(),
    phone: yup.string().matches(/^\d{10}$/, 'Phone number must be 10 digits'),
    paymentMode: yup.string().oneOf(['Prepaid', 'COD'], 'Payment mode must be Prepaid or COD'),
    status: yup
        .string()
        .oneOf(['pending', 'created', 'in_transit', 'delivered', 'failed', 'cancelled'], 'Invalid status'),
    fromName: yup.string(),
    fromAdd: yup.string(),
    fromPin: yup.string().matches(/^\d{6}$/, 'From PIN code must be 6 digits'),
    fromCity: yup.string(),
    fromState: yup.string(),
    fromCountry: yup.string(),
    fromPhone: yup.string().matches(/^\d{10}$/, 'From phone number must be 10 digits'),
    returnPin: yup.string(),
    returnCity: yup.string(),
    returnPhone: yup.string(),
    returnAdd: yup.string(),
    returnState: yup.string(),
    returnCountry: yup.string(),
    productsDesc: yup.string(),
    codAmount: yup.string(),
    totalAmount: yup.string(),
    weight: yup.string(),
    shippingMode: yup.string().oneOf(['Surface', 'Express'], 'Shipping mode must be Surface or Express'),
});
