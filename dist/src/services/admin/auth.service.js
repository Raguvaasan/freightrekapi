"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const adminUser_model_1 = require("../../models/admin/adminUser.model");
const jwt_1 = require("../../utils/jwt");
const phoneCheck_1 = require("../../utils/phoneCheck");
const register = async (rb) => {
    try {
        const { name, email, password, phoneNo, roleId } = rb;
        const existingUser = await adminUser_model_1.AdminUser.findOne({ email });
        if (existingUser) {
            return { success: false, message: "User already exists" };
        }
        // Check phone global uniqueness
        const phoneError = await (0, phoneCheck_1.checkPhoneGloballyUnique)(phoneNo);
        if (phoneError) {
            return { success: false, message: phoneError };
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await adminUser_model_1.AdminUser.create({
            name,
            email,
            phoneNo,
            password: hashedPassword,
            roleId
        });
        return {
            success: true,
            message: "User registered successfully",
        };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.register = register;
const login = async (rb) => {
    try {
        const { email, password } = rb;
        const user = await adminUser_model_1.AdminUser.findOne({ email }).select("+password");
        if (!user) {
            return { success: false, message: "Invalid credentials" };
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return { success: false, message: "Invalid credentials" };
        }
        return {
            success: true,
            message: "Login successful",
            token: (0, jwt_1.generateToken)(user._id.toString())
        };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.login = login;
