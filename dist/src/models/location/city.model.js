"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.City = void 0;
const mongoose_1 = require("mongoose");
const citySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    stateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'State',
        required: true
    },
    pincode: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Compound index for unique city names within a state
citySchema.index({ name: 1, stateId: 1 }, { unique: true });
citySchema.index({ stateId: 1, isActive: 1 });
exports.City = (0, mongoose_1.model)('City', citySchema);
