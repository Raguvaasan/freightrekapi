"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2bMarkup = void 0;
const mongoose_1 = require("mongoose");
const b2bMarkupSchema = new mongoose_1.Schema({
    markupCategory: {
        type: String,
        enum: ['rate_calculator', 'rate_card'],
        required: true,
    },
    markupType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    markupValue: {
        type: Number,
        required: true,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
    },
}, {
    timestamps: true,
});
// Unique active markup per category (only one active per category)
b2bMarkupSchema.index({ markupCategory: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
exports.B2bMarkup = (0, mongoose_1.model)('B2bMarkup', b2bMarkupSchema);
