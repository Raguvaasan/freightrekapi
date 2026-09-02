"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bUser = void 0;
const mongoose_1 = require("mongoose");
const b2bUserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true, unique: true, index: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    gstNumber: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });
exports.B2bUser = (0, mongoose_1.model)('B2bUser', b2bUserSchema);
