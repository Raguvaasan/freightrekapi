"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const mongoose_1 = require("mongoose");
const stateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Compound index for unique state names within a country
stateSchema.index({ name: 1, countryId: 1 }, { unique: true });
stateSchema.index({ countryId: 1, isActive: 1 });
exports.State = (0, mongoose_1.model)('State', stateSchema);
