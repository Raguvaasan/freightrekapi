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
exports.reverseAgencyPaymentSchema = exports.recordAgencyPaymentSchema = exports.agencyPayoutByAgencySchema = void 0;
const yup = __importStar(require("yup"));
const objectId = /^[0-9a-fA-F]{24}$/;
const agencyIdParam = yup.object({
    agencyId: yup
        .string()
        .required('Agency ID is required')
        .matches(objectId, 'Invalid agency ID'),
});
exports.agencyPayoutByAgencySchema = yup.object({
    params: agencyIdParam,
});
/** The "Pay" button. Only the amount is required. */
exports.recordAgencyPaymentSchema = yup.object({
    body: yup.object({
        amount: yup
            .number()
            .typeError('Amount must be a number')
            .required('Amount is required')
            .moreThan(0, 'Amount must be greater than 0')
            .max(10000000, 'Amount cannot exceed 1,00,00,000'),
        paymentMethod: yup
            .string()
            .max(50, 'Payment method must not exceed 50 characters')
            .trim()
            .optional(),
        reference: yup
            .string()
            .max(100, 'Reference must not exceed 100 characters')
            .trim()
            .optional(),
        remarks: yup
            .string()
            .max(500, 'Remarks must not exceed 500 characters')
            .trim()
            .optional(),
    }),
    params: agencyIdParam,
});
exports.reverseAgencyPaymentSchema = yup.object({
    body: yup.object({
        reason: yup
            .string()
            .max(500, 'Reason must not exceed 500 characters')
            .trim()
            .optional(),
    }),
    params: yup.object({
        paymentId: yup
            .string()
            .required('Payment ID is required')
            .matches(objectId, 'Invalid payment ID'),
    }),
});
