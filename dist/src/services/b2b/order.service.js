"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.b2bOrderService = void 0;
const bharat_pincode_1 = __importDefault(require("bharat-pincode"));
const mongoose_1 = require("mongoose");
const b2bOrder_model_1 = require("../../models/b2b/b2bOrder.model");
const b2bVehicle_model_1 = require("../../models/b2b/b2bVehicle.model");
const distanceBetween = (fromPin, toPin) => {
    const dist = bharat_pincode_1.default.distanceBetween(fromPin, toPin);
    if (dist == null)
        throw new Error('Unable to calculate distance for the provided pincodes');
    return Number(dist.toFixed(2));
};
exports.b2bOrderService = {
    async createDraft(userId, payload) {
        const order = await b2bOrder_model_1.B2bOrder.create({
            b2bUserId: userId,
            status: 'DRAFT',
            bookingCustomer: payload.bookingCustomer,
            deliveryCustomer: payload.deliveryCustomer,
            shipment: { approximateWeight: Number(payload.approximateWeight) },
        });
        return { success: true, message: 'Order draft created successfully', data: order };
    },
    async getDraftStep2Details(orderId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, message: 'Invalid draft ID' };
        const order = await b2bOrder_model_1.B2bOrder.findOne({ _id: orderId, b2bUserId: userId });
        if (!order)
            return { success: false, message: 'Draft not found' };
        const vehicle = await b2bVehicle_model_1.B2bVehicle.findOne({
            status: 'Active',
            capacityKg: { $gte: order.shipment.approximateWeight },
        }).sort({ capacityKg: 1, ratePerKm: 1 });
        if (!vehicle)
            return { success: false, message: 'No suitable vehicle found' };
        const distanceKm = distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
        const totalAmount = Number((distanceKm * vehicle.ratePerKm).toFixed(2));
        return {
            success: true,
            data: {
                order,
                vehicle,
                distanceKm,
                ratePerKm: vehicle.ratePerKm,
                totalAmount,
            },
        };
    },
    async confirm(orderId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, message: 'Invalid draft ID' };
        const order = await b2bOrder_model_1.B2bOrder.findOne({ _id: orderId, b2bUserId: userId });
        if (!order)
            return { success: false, message: 'Draft not found' };
        const vehicle = await b2bVehicle_model_1.B2bVehicle.findOne({
            status: 'Active',
            capacityKg: { $gte: order.shipment.approximateWeight },
        }).sort({ capacityKg: 1, ratePerKm: 1 });
        if (!vehicle)
            return { success: false, message: 'No suitable vehicle found' };
        const distanceKm = distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
        const totalAmount = Number((distanceKm * vehicle.ratePerKm).toFixed(2));
        order.status = 'CONFIRMED';
        order.selectedVehicleId = vehicle._id;
        order.selectedVehicle = { vehicleType: vehicle.vehicleType, capacityKg: vehicle.capacityKg };
        order.distanceKm = distanceKm;
        order.ratePerKm = vehicle.ratePerKm;
        order.totalAmount = totalAmount;
        await order.save();
        return { success: true, message: 'B2B order confirmed successfully', data: order };
    },
    async getById(orderId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, message: 'Invalid order ID' };
        const query = { _id: orderId };
        if (userId)
            query.b2bUserId = userId;
        const order = await b2bOrder_model_1.B2bOrder.findOne(query).populate('selectedVehicleId');
        if (!order)
            return { success: false, message: 'Order not found' };
        return { success: true, data: order };
    },
    async list(userId, query = {}) {
        const page = Number(query.page || 1);
        const limit = Number(query.limit || 10);
        const filter = {};
        if (userId)
            filter.b2bUserId = userId;
        if (query.status)
            filter.status = query.status;
        const [orders, total] = await Promise.all([
            b2bOrder_model_1.B2bOrder.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
            b2bOrder_model_1.B2bOrder.countDocuments(filter),
        ]);
        return { success: true, data: { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
    },
};
