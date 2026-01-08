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
exports.createCitySchema = exports.createStateSchema = exports.createCountrySchema = void 0;
const yup = __importStar(require("yup"));
exports.createCountrySchema = yup.object({
    name: yup.string().required('Country name is required').trim(),
    code: yup.string().required('Country code is required').trim().uppercase().min(2).max(3)
});
exports.createStateSchema = yup.object({
    name: yup.string().required('State name is required').trim(),
    countryId: yup.string().required('Country ID is required').matches(/^[0-9a-fA-F]{24}$/, 'Invalid country ID'),
    code: yup.string().required('State code is required').trim().uppercase()
});
exports.createCitySchema = yup.object({
    name: yup.string().required('City name is required').trim(),
    stateId: yup.string().required('State ID is required').matches(/^[0-9a-fA-F]{24}$/, 'Invalid state ID'),
    pincode: yup.string().optional().trim()
});
