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
exports.ndrActionSchema = exports.rvpQcSchema = exports.downloadDocumentSchema = exports.webhookConfigSchema = exports.warehouseUpdateSchema = exports.warehouseCreateSchema = exports.pickupRequestSchema = exports.labelSchema = exports.shippingCostSchema = exports.shipmentTrackingSchema = exports.ewaybillSchema = exports.shipmentCancelSchema = exports.shipmentUpdateSchema = exports.shipmentManifestSchema = exports.fetchWaybillSchema = exports.pincodeServiceabilitySchema = void 0;
const yup = __importStar(require("yup"));
// Minimal placeholder schemas; adjust per Delhivery spec when available
const objectId = /^[0-9a-fA-F]{24}$/;
exports.pincodeServiceabilitySchema = yup.object({
    pin: yup.string().required(),
});
exports.fetchWaybillSchema = yup.object({
    count: yup.number().min(1).max(1000).required(),
});
exports.shipmentManifestSchema = yup.object({
    orderId: yup.string().required(),
    waybill: yup.string().optional(),
});
exports.shipmentUpdateSchema = yup.object({
    waybill: yup.string().required(),
    updates: yup.object().required(),
});
exports.shipmentCancelSchema = yup.object({
    waybill: yup.string().required(),
});
exports.ewaybillSchema = yup.object({
    waybill: yup.string().required(),
    ewaybillNumber: yup.string().required(),
});
exports.shipmentTrackingSchema = yup.object({
    waybill: yup.string().required(),
});
exports.shippingCostSchema = yup.object({
    fromPincode: yup.string().required(),
    toPincode: yup.string().required(),
    weight: yup.number().required(),
});
exports.labelSchema = yup.object({
    waybill: yup.string().required(),
});
exports.pickupRequestSchema = yup.object({
    pickupLocation: yup.string().required(),
    shipments: yup.array().of(yup.string()).required(),
});
exports.warehouseCreateSchema = yup.object({
    name: yup.string().required(),
    address: yup.string().required(),
    pincode: yup.string().required(),
});
exports.warehouseUpdateSchema = yup.object({
    warehouseId: yup.string().matches(objectId).required(),
});
exports.webhookConfigSchema = yup.object({
    url: yup.string().url().required(),
    events: yup.array().of(yup.string()).required(),
});
exports.downloadDocumentSchema = yup.object({
    waybill: yup.string().required(),
});
exports.rvpQcSchema = yup.object({
    orderId: yup.string().required(),
});
exports.ndrActionSchema = yup.object({
    waybill: yup.string().required(),
    action: yup.string().required(),
});
