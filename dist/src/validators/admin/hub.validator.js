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
exports.updateHubSchema = exports.createHubSchema = void 0;
const yup = __importStar(require("yup"));
exports.createHubSchema = yup.object({
    hubName: yup
        .string()
        .trim()
        .min(2, "hubName must be at least 2 characters")
        .required("hubName is required"),
    hubManagerName: yup
        .string()
        .trim()
        .min(2, "hubManagerName must be at least 2 characters")
        .required("hubManagerName is required"),
    phoneNo: yup
        .number()
        .min(10, "phoneNo must be 10 characters")
        .required("hubManagerName is required"),
    address: yup
        .string()
        .trim()
        .min(2, "address must be at least 2 characters")
        .required("address is required"),
    city: yup
        .string()
        .trim()
        .min(2, "city must be at least 2 characters")
        .required("city is required"),
    state: yup
        .string()
        .trim()
        .min(2, "state must be at least 2 characters")
        .required("state is required"),
    pincode: yup
        .number()
        .min(6, "pincode must be 6 characters")
        .required("pincode is required"),
    username: yup
        .string()
        .trim()
        .min(2, "username must be at least 2 characters")
        .required("username is required"),
    password: yup
        .string()
        .trim()
        .min(2, "password must be at least 2 characters")
        .required("password is required"),
    status: yup
        .boolean()
        .optional(),
});
exports.updateHubSchema = exports.createHubSchema.shape({
    hubName: yup
        .string()
        .min(2)
        .optional(),
    hubManagerName: yup
        .string()
        .min(2)
        .optional(),
    phoneNo: yup
        .number()
        .min(10)
        .optional(),
    address: yup
        .string()
        .min(2)
        .optional(),
    city: yup
        .string()
        .min(2)
        .optional(),
    state: yup
        .string()
        .min(2)
        .optional(),
    pincode: yup
        .number()
        .min(6)
        .optional(),
    username: yup
        .string()
        .min(2)
        .optional(),
    password: yup
        .string()
        .min(2)
        .optional(),
    status: yup
        .boolean()
        .optional(),
});
