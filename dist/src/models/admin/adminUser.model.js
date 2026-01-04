"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUser = void 0;
const mongoose_1 = require("mongoose");
const adminUserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
    },
    phoneNo: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    status: {
        type: Boolean,
        default: true,
    },
    roleId: {
        type: mongoose_1.Types.ObjectId,
        ref: "AdminRole",
        required: true,
    },
}, { timestamps: true });
exports.AdminUser = (0, mongoose_1.model)("AdminUser", adminUserSchema);
