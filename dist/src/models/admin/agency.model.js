"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agency = exports.DEFAULT_MISC_CHARGE_PERCENTAGE = exports.DEFAULT_LOADING_CHARGE_PERCENTAGE = exports.AGENCY_TYPES = void 0;
const mongoose_1 = require("mongoose");
/**
 * Ownership of the agency. Commission (profitPercentage) is only applicable to
 * a third-party agency — an "Own" agency is company-run, so the whole booking
 * amount belongs to the admin and no commission is kept.
 */
exports.AGENCY_TYPES = ['Third Party', 'Own'];
/** Percentages added on top of the transportation charge, per agency */
exports.DEFAULT_LOADING_CHARGE_PERCENTAGE = 10;
exports.DEFAULT_MISC_CHARGE_PERCENTAGE = 10;
const agencySchema = new mongoose_1.Schema({
    agencyName: {
        type: String,
        required: [true, 'Agency name is required'],
        trim: true,
    },
    agencyOwner: {
        type: String,
        required: [true, 'Agency owner is required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    type: {
        type: String,
        enum: exports.AGENCY_TYPES,
        default: 'Third Party',
    },
    agencyType: {
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    address: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    pincode: {
        type: String,
        trim: true,
    },
    gstNumber: {
        type: String,
        trim: true,
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        select: false,
    },
    profitPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Profit percentage cannot be negative'],
        max: [100, 'Profit percentage cannot exceed 100'],
    },
    loadingChargePercentage: {
        type: Number,
        default: exports.DEFAULT_LOADING_CHARGE_PERCENTAGE,
        min: [0, 'Loading charge percentage cannot be negative'],
        max: [100, 'Loading charge percentage cannot exceed 100'],
    },
    miscChargePercentage: {
        type: Number,
        default: exports.DEFAULT_MISC_CHARGE_PERCENTAGE,
        min: [0, 'Miscellaneous charge percentage cannot be negative'],
        max: [100, 'Miscellaneous charge percentage cannot exceed 100'],
    },
}, {
    timestamps: true,
});
/**
 * Keep the two spellings of ownership in step, then apply the commission rule.
 *
 * `agencyType` is the boolean the form sends and `type` is the stored wording;
 * whichever one the caller changed drives the other, so neither can drift. The
 * validator rejects a create/update that sends both and disagrees, so by the
 * time this runs there is never a real conflict to resolve.
 */
agencySchema.pre('save', function () {
    if (this.isModified('agencyType') && !this.isModified('type')) {
        this.type = this.agencyType ? 'Own' : 'Third Party';
    }
    this.agencyType = this.type === 'Own';
    // An "Own" agency never keeps a commission, whatever was sent
    if (this.type === 'Own' && this.profitPercentage !== 0) {
        this.profitPercentage = 0;
    }
});
// Index for faster queries
agencySchema.index({ agencyName: 1 });
agencySchema.index({ status: 1 });
agencySchema.index({ type: 1 });
exports.Agency = (0, mongoose_1.model)('Agency', agencySchema);
