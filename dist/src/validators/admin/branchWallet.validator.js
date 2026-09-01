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
exports.walletTransactionByIdSchema = exports.reverseWalletTransactionSchema = exports.updateWalletTransactionSchema = exports.updateBranchPercentagesSchema = exports.branchWalletByIdSchema = exports.debitBranchWalletSchema = exports.creditBranchWalletSchema = void 0;
const yup = __importStar(require("yup"));
const objectId = /^[0-9a-fA-F]{24}$/;
const branchIdParam = yup.object({
    branchId: yup
        .string()
        .required('Branch ID is required')
        .matches(objectId, 'Invalid branch ID'),
});
const transactionIdParam = yup.object({
    transactionId: yup
        .string()
        .required('Transaction ID is required')
        .max(120, 'Invalid transaction ID')
        .trim(),
});
const amountField = yup
    .number()
    .typeError('Amount must be a number')
    .required('Amount is required')
    .moreThan(0, 'Amount must be greater than 0')
    .max(1000000, 'Amount must not exceed ₹10,00,000');
// Admin adds money to a branch wallet
exports.creditBranchWalletSchema = yup.object({
    body: yup.object({
        amount: amountField,
        remarks: yup.string().max(500, 'Remarks must not exceed 500 characters').trim().optional(),
        paymentMethod: yup.string().max(50).trim().optional(),
        reference: yup
            .string()
            .max(100, 'Reference must not exceed 100 characters')
            .trim()
            .optional(),
    }),
    params: branchIdParam,
});
// Admin deducts money from a branch wallet
exports.debitBranchWalletSchema = yup.object({
    body: yup.object({
        amount: amountField,
        remarks: yup.string().max(500, 'Remarks must not exceed 500 characters').trim().optional(),
        paymentMethod: yup.string().max(50).trim().optional(),
        reference: yup
            .string()
            .max(100, 'Reference must not exceed 100 characters')
            .trim()
            .optional(),
    }),
    params: branchIdParam,
});
exports.branchWalletByIdSchema = yup.object({
    params: branchIdParam,
});
const percentageField = (label) => yup
    .number()
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .max(100, `${label} cannot exceed 100`)
    .optional();
// Admin sets the commission / loading / miscellaneous percentages for a branch.
// Every field is optional; the service rejects a body with none of them.
exports.updateBranchPercentagesSchema = yup.object({
    body: yup.object({
        profitPercentage: percentageField('Profit percentage'),
        loadingChargePercentage: percentageField('Loading charge percentage'),
        miscChargePercentage: percentageField('Miscellaneous charge percentage'),
    }),
    params: branchIdParam,
});
exports.updateWalletTransactionSchema = yup.object({
    body: yup.object({
        remarks: yup
            .string()
            .required('Remarks are required')
            .min(2, 'Remarks must be at least 2 characters')
            .max(500, 'Remarks must not exceed 500 characters')
            .trim(),
    }),
    params: transactionIdParam,
});
exports.reverseWalletTransactionSchema = yup.object({
    body: yup
        .object({
        reason: yup.string().max(500, 'Reason must not exceed 500 characters').trim().optional(),
    })
        .default({}),
    params: transactionIdParam,
});
exports.walletTransactionByIdSchema = yup.object({
    params: transactionIdParam,
});
