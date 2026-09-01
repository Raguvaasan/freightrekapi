"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toParcelOrderResponse = exports.ParcelOrder = exports.WALLET_SETTLEMENT_STATUSES = exports.PAYMENT_TYPES = exports.INWARD_PENDING_STATUSES = exports.HUB_IN_TRANSIT_STATUSES = exports.HUB_PENDING_STATUSES = exports.IN_TRANSIT_STATUSES = exports.statusIndex = exports.HUB_DEPENDENT_STATUSES = exports.HUB_ALLOWED_STATUSES = exports.AGENCY_ALLOWED_STATUSES = exports.DESTINATION_AGENCY_STATUSES = exports.ORIGIN_AGENCY_STATUSES = exports.statusLabel = exports.ACTOR_ROLES_STORED = exports.PARCEL_STATUSES = void 0;
const mongoose_1 = require("mongoose");
// Parcel lifecycle statuses (in workflow order).
// Booking agency -> admin assigns hub -> hub processes -> destination agency delivers.
//
// NAMING: what used to be called a "branch" is now an "agency" throughout the
// API. The stored fields are `agency` and `deliveryCustomer.deliveryAgency`;
// the old `branch` / `deliveryBranch` names are still accepted on input and
// mirrored on output for the existing frontend (see toAgencyResponse).
exports.PARCEL_STATUSES = [
    'Order Created',
    'Parcel Collected',
    'Hub Assigned',
    'Parcel Dispatched',
    'Parcel Arrived at Hub',
    'Parcel Processed at Hub',
    'Parcel Dispatched from Hub',
    'Parcel Arrived at Branch',
    'Parcel Received at Branch',
    'Delivered',
];
exports.ACTOR_ROLES_STORED = ['admin', 'agency', 'branch', 'hub'];
/**
 * The status values are stored as-is (renaming them would rewrite every
 * order's history), so this maps them to the current "Agency" wording for
 * display. Responses carry it as `statusLabel`.
 */
const statusLabel = (status) => status?.replace(/\bBranch\b/g, 'Agency');
exports.statusLabel = statusLabel;
// Booking agency (origin) stages
exports.ORIGIN_AGENCY_STATUSES = [
    'Parcel Collected',
    'Parcel Dispatched',
];
// Delivery agency (destination) stages
exports.DESTINATION_AGENCY_STATUSES = [
    'Parcel Arrived at Branch',
    'Parcel Received at Branch',
    'Delivered',
];
exports.AGENCY_ALLOWED_STATUSES = [
    ...exports.ORIGIN_AGENCY_STATUSES,
    ...exports.DESTINATION_AGENCY_STATUSES,
];
exports.HUB_ALLOWED_STATUSES = [
    'Parcel Arrived at Hub',
    'Parcel Processed at Hub',
    'Parcel Dispatched from Hub',
];
// Statuses that cannot be reached before a hub has been assigned
exports.HUB_DEPENDENT_STATUSES = [
    'Parcel Arrived at Hub',
    'Parcel Processed at Hub',
    'Parcel Dispatched from Hub',
];
const statusIndex = (status) => exports.PARCEL_STATUSES.indexOf(status);
exports.statusIndex = statusIndex;
/** The stages between two points of the lifecycle, `from` included, `to` not */
const stagesBetween = (from, to) => exports.PARCEL_STATUSES.slice((0, exports.statusIndex)(from), (0, exports.statusIndex)(to));
// ---------------------------------------------------------- dashboard buckets
// Derived from the lifecycle order above rather than listed again, so inserting
// a stage cannot leave a dashboard counting the wrong set.
/** Left the booking agency and not yet delivered */
exports.IN_TRANSIT_STATUSES = stagesBetween('Parcel Dispatched', 'Delivered');
/** Assigned to a hub, which has not dispatched it onward yet */
exports.HUB_PENDING_STATUSES = stagesBetween('Hub Assigned', 'Parcel Dispatched from Hub');
/** Dispatched onward by the hub and not yet delivered */
exports.HUB_IN_TRANSIT_STATUSES = stagesBetween('Parcel Dispatched from Hub', 'Delivered');
/**
 * An inward parcel is one addressed to an agency that it has not handed over
 * yet — a delivered parcel drops off the inward list.
 */
exports.INWARD_PENDING_STATUSES = stagesBetween('Order Created', 'Delivered');
exports.PAYMENT_TYPES = ['Paid', 'To Pay', 'Credit'];
exports.WALLET_SETTLEMENT_STATUSES = [
    'settled',
    'reversed',
    'unsettled',
];
const statusHistorySchema = new mongoose_1.Schema({
    status: { type: String, enum: exports.PARCEL_STATUSES, required: true },
    note: { type: String, trim: true },
    updatedBy: { type: String },
    updatedByRole: { type: String, enum: exports.ACTOR_ROLES_STORED },
    updatedByName: { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now },
}, { _id: false });
const walletSettlementSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: exports.WALLET_SETTLEMENT_STATUSES,
        default: 'unsettled',
    },
    orderAmount: { type: Number, default: 0, min: 0 },
    profitPercentage: { type: Number, default: 0, min: 0, max: 100 },
    agencyProfitAmount: { type: Number, default: 0, min: 0 },
    adminShareAmount: { type: Number, default: 0, min: 0 },
    walletDebitAmount: { type: Number, default: 0, min: 0 },
    settledAt: { type: Date },
}, { _id: false });
const parcelOrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    agency: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agency',
        required: [true, 'Agency is required'],
    },
    bookingCustomer: {
        name: {
            type: String,
            required: [true, 'Booking customer name is required'],
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: [true, 'Booking customer mobile number is required'],
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
    },
    paymentType: {
        type: String,
        enum: exports.PAYMENT_TYPES,
        required: [true, 'Payment type is required'],
    },
    deliveryCustomer: {
        name: {
            type: String,
            required: [true, 'Delivery customer name is required'],
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: [true, 'Delivery customer mobile number is required'],
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        deliveryAgency: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Agency',
        },
    },
    pickupAddress: {
        type: String,
        trim: true,
    },
    deliveryAddress: {
        type: String,
        trim: true,
    },
    parcelDetails: {
        article: {
            type: String,
            required: [true, 'Article is required'],
            trim: true,
        },
        remarks: {
            type: String,
            trim: true,
        },
        numberOfParcels: {
            type: Number,
            required: [true, 'Number of parcels is required'],
            min: [1, 'Number of parcels must be at least 1'],
        },
        approximateValue: {
            type: Number,
            min: [0, 'Approximate value cannot be negative'],
            default: 0,
        },
    },
    waybill: {
        type: String,
        trim: true,
        uppercase: true,
    },
    vehicleType: {
        type: String,
        trim: true,
    },
    vehicleCapacity: {
        type: String,
        trim: true,
    },
    transportationCharge: {
        type: Number,
        default: 0,
        min: [0, 'Transportation charge cannot be negative'],
    },
    loadingChargePercentage: {
        type: Number,
        default: 0,
        min: [0, 'Loading charge percentage cannot be negative'],
    },
    loadingCharge: {
        type: Number,
        default: 0,
        min: [0, 'Loading charge cannot be negative'],
    },
    miscChargePercentage: {
        type: Number,
        default: 0,
        min: [0, 'Miscellaneous charge percentage cannot be negative'],
    },
    miscellaneousCharge: {
        type: Number,
        default: 0,
        min: [0, 'Miscellaneous charge cannot be negative'],
    },
    totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Total amount cannot be negative'],
    },
    hub: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Hub',
    },
    hubAssignedAt: {
        type: Date,
    },
    hubAssignedBy: {
        type: String,
    },
    vehicle: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Vehicle',
    },
    driver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Driver',
    },
    dispatchAssignedAt: {
        type: Date,
    },
    dispatchAssignedBy: {
        type: String,
    },
    status: {
        type: String,
        enum: exports.PARCEL_STATUSES,
        default: 'Order Created',
    },
    statusHistory: {
        type: [statusHistorySchema],
        default: [],
    },
    walletSettlement: {
        type: walletSettlementSchema,
        default: () => ({}),
    },
}, {
    timestamps: true,
});
parcelOrderSchema.index({ status: 1 });
parcelOrderSchema.index({ agency: 1 });
parcelOrderSchema.index({ hub: 1 });
parcelOrderSchema.index({ 'deliveryCustomer.deliveryAgency': 1 });
parcelOrderSchema.index({ createdAt: -1 });
// Waybill lookups; sparse because it is optional and often not filled in
parcelOrderSchema.index({ waybill: 1 }, { sparse: true });
// Outward / inward registers: one agency's movements, newest first
parcelOrderSchema.index({ agency: 1, createdAt: -1 });
parcelOrderSchema.index({ 'deliveryCustomer.deliveryAgency': 1, createdAt: -1 });
// Customer Management: one customer's bookings, newest first. The mobile number
// is what identifies a booking customer — see BookingCustomerService.
parcelOrderSchema.index({ 'bookingCustomer.mobileNumber': 1, createdAt: -1 });
exports.ParcelOrder = (0, mongoose_1.model)('ParcelOrder', parcelOrderSchema);
/**
 * Shape a parcel order for the API.
 *
 * `agency` / `deliveryAgency` are the current names. The old `branch` /
 * `deliveryBranch` keys are mirrored alongside them so the existing frontend
 * keeps working; they are deprecated and can be dropped once it has moved
 * over. Also adds display labels that say "Agency" instead of "Branch".
 */
const toParcelOrderResponse = (order) => {
    if (!order)
        return order;
    const plain = typeof order.toObject === 'function' ? order.toObject() : { ...order };
    const delivery = plain.deliveryCustomer
        ? {
            ...plain.deliveryCustomer,
            // deprecated mirror
            deliveryBranch: plain.deliveryCustomer.deliveryAgency,
        }
        : plain.deliveryCustomer;
    return {
        ...plain,
        // deprecated mirror
        branch: plain.agency,
        deliveryCustomer: delivery,
        statusLabel: (0, exports.statusLabel)(plain.status),
        statusHistory: Array.isArray(plain.statusHistory)
            ? plain.statusHistory.map((entry) => ({
                ...entry,
                statusLabel: (0, exports.statusLabel)(entry.status),
                // old rows recorded the actor as 'branch'
                updatedByRole: entry.updatedByRole === 'branch' ? 'agency' : entry.updatedByRole,
            }))
            : plain.statusHistory,
    };
};
exports.toParcelOrderResponse = toParcelOrderResponse;
