"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubModel = void 0;
const mongoose_1 = require("mongoose");
const hubSchema = new mongoose_1.Schema({
    hubName: {
        type: String,
        required: true,
        trim: true,
    },
    hubManagerName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNo: {
        type: Number,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: Number,
        required: true,
        trim: true,
    },
    status: {
        type: Boolean,
        default: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
}, { timestamps: true });
exports.HubModel = (0, mongoose_1.model)("Hub", hubSchema);
