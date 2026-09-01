"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const customerUser_model_1 = require("../models/customer/customerUser.model");
const jwt_1 = require("../utils/jwt");
const signup = async (rb) => {
    try {
        const { firstName, lastName, email, password, mobileNumber, gst } = rb;
        const existingCustomer = await customerUser_model_1.CustomerUser.findOne({ email });
        if (existingCustomer) {
            return { success: false, message: 'Customer with this email already exists' };
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const customer = await customerUser_model_1.CustomerUser.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            mobileNumber,
            gst,
        });
        const token = (0, jwt_1.generateToken)(customer._id.toString());
        return {
            success: true,
            message: 'Customer registered successfully',
            data: {
                id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                mobileNumber: customer.mobileNumber,
                gst: customer.gst,
                status: customer.status,
            },
            token,
        };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.signup = signup;
const login = async (rb) => {
    try {
        const { email, password } = rb;
        const customer = await customerUser_model_1.CustomerUser.findOne({ email }).select('+password');
        if (!customer) {
            return { success: false, message: 'Invalid credentials' };
        }
        const isMatch = await bcryptjs_1.default.compare(password, customer.password);
        if (!isMatch) {
            return { success: false, message: 'Invalid credentials' };
        }
        const token = (0, jwt_1.generateToken)(customer._id.toString());
        return {
            success: true,
            message: 'Login successful',
            data: {
                id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                mobileNumber: customer.mobileNumber,
                gst: customer.gst,
                status: customer.status,
            },
            token,
        };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.login = login;
