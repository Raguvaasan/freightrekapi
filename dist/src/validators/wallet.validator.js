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
exports.getTransactionsSchema = exports.verifyPaymentSchema = exports.createPaymentOrderSchema = void 0;
const yup = __importStar(require("yup"));
exports.createPaymentOrderSchema = yup.object().shape({
    amount: yup
        .number()
        .required('Amount is required')
        .min(1, 'Minimum amount is ₹1')
        .max(100000, 'Maximum amount is ₹100,000'),
    paymentMethod: yup
        .string()
        .required('Payment method is required')
        .oneOf(['upi', 'card', 'netbanking', 'wallet'], 'Invalid payment method'),
});
exports.verifyPaymentSchema = yup.object().shape({
    orderId: yup.string().required('Order ID is required'),
    paymentId: yup.string().optional(),
});
exports.getTransactionsSchema = yup.object().shape({
    page: yup.number().min(1, 'Page must be at least 1'),
    limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
    type: yup.string().oneOf(['credit', 'debit', 'refund', 'reversal'], 'Invalid transaction type'),
});
