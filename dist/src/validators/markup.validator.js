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
exports.getMarkupQuerySchema = exports.createMarkupSchema = void 0;
const yup = __importStar(require("yup"));
/**
 * Validator for creating/updating markup
 */
exports.createMarkupSchema = yup.object({
    body: yup.object({
        markup_type: yup
            .string()
            .required('markup_type is required')
            .oneOf(['percentage', 'fixed'], 'markup_type must be either percentage or fixed'),
        markup_value: yup
            .number()
            .required('markup_value is required')
            .min(0, 'markup_value must be greater than or equal to 0')
            .test('percentage-range', 'markup_value must be between 0 and 100 for percentage type', function (value) {
            const { markup_type } = this.parent;
            if (markup_type === 'percentage') {
                return value !== undefined && value >= 0 && value <= 100;
            }
            return true;
        }),
        user_id: yup.string().optional(),
        franchise_id: yup.string().optional(),
    }),
});
/**
 * Validator for GET query parameters (optional)
 */
exports.getMarkupQuerySchema = yup.object({
    query: yup.object({
        user_id: yup.string().optional(),
        franchise_id: yup.string().optional(),
    }),
});
