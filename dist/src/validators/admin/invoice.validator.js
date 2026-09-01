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
exports.invoiceStatusValues = exports.cancelInvoiceSchema = exports.updateInvoiceNotesSchema = exports.invoiceByOrderSchema = exports.invoiceByNumberSchema = exports.invoiceByIdSchema = void 0;
const yup = __importStar(require("yup"));
const invoice_model_1 = require("../../models/admin/invoice.model");
const objectId = /^[0-9a-fA-F]{24}$/;
const invoiceIdParam = yup.object({
    id: yup
        .string()
        .required('Invoice ID is required')
        .matches(objectId, 'Invalid invoice ID'),
});
exports.invoiceByIdSchema = yup.object({
    params: invoiceIdParam,
});
exports.invoiceByNumberSchema = yup.object({
    params: yup.object({
        invoiceNumber: yup
            .string()
            .required('Invoice number is required')
            .max(60, 'Invalid invoice number')
            .trim(),
    }),
});
exports.invoiceByOrderSchema = yup.object({
    params: yup.object({
        orderId: yup
            .string()
            .required('Order ID is required')
            .matches(objectId, 'Invalid order ID'),
    }),
});
exports.updateInvoiceNotesSchema = yup.object({
    body: yup.object({
        notes: yup
            .string()
            .required('Notes are required')
            .min(2, 'Notes must be at least 2 characters')
            .max(1000, 'Notes must not exceed 1000 characters')
            .trim(),
    }),
    params: invoiceIdParam,
});
exports.cancelInvoiceSchema = yup.object({
    body: yup
        .object({
        reason: yup
            .string()
            .max(500, 'Reason must not exceed 500 characters')
            .trim()
            .optional(),
    })
        .default({}),
    params: invoiceIdParam,
});
exports.invoiceStatusValues = invoice_model_1.INVOICE_STATUSES;
