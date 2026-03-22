"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shipment = void 0;
const mongoose_1 = require("mongoose");
const shipmentSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    waybill: {
        type: String,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    add: {
        type: String,
        required: true,
    },
    pin: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
        default: 'India',
    },
    phone: {
        type: String,
        required: true,
    },
    order: {
        type: String,
        required: true,
    },
    paymentMode: {
        type: String,
        enum: ['Prepaid', 'COD'],
        required: true,
    },
    fromName: String,
    fromAdd: String,
    fromPin: String,
    fromCity: String,
    fromState: String,
    fromCountry: String,
    fromPhone: String,
    returnPin: String,
    returnCity: String,
    returnPhone: String,
    returnAdd: String,
    returnState: String,
    returnCountry: String,
    productsDesc: String,
    hsnCode: String,
    codAmount: String,
    orderDate: Date,
    totalAmount: String,
    sellerAdd: String,
    sellerName: String,
    sellerInv: String,
    quantity: String,
    shipmentWidth: {
        type: String,
        default: '100',
    },
    shipmentHeight: {
        type: String,
        default: '100',
    },
    weight: String,
    shippingMode: {
        type: String,
        enum: ['Surface', 'Express'],
        default: 'Surface',
    },
    addressType: String,
    pickupLocation: {
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
        },
        pincode: {
            type: String,
        },
    },
    status: {
        type: String,
        enum: ['pending', 'created', 'Active', 'in_transit', 'delivered', 'failed', 'cancelled'],
        default: 'pending',
        index: true,
    },
    delhiveryResponse: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    trackingUrl: String,
}, { timestamps: true });
// Create compound index for user queries
shipmentSchema.index({ userId: 1, createdAt: -1 });
shipmentSchema.index({ userId: 1, status: 1 });
exports.Shipment = (0, mongoose_1.model)('Shipment', shipmentSchema);
