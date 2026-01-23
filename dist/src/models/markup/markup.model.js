"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Markup = void 0;
const mongoose_1 = require("mongoose");
const markupSchema = new mongoose_1.Schema({
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
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        default: null,
    },
    franchiseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agency',
        default: null,
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
// Compound index for efficient queries and uniqueness
markupSchema.index({ markupCategory: 1, userId: 1, franchiseId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
// Index for priority-based queries
markupSchema.index({ markupCategory: 1, isActive: 1 });
exports.Markup = (0, mongoose_1.model)('Markup', markupSchema);
