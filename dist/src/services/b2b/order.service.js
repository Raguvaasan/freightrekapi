"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.b2bOrderService = void 0;
const mongoose_1 = require("mongoose");
const b2bOrder_model_1 = require("../../models/b2b/b2bOrder.model");
const b2bVehicle_model_1 = require("../../models/b2b/b2bVehicle.model");
const driver_model_1 = require("../../models/admin/driver.model");
const b2bInvoice_model_1 = require("../../models/b2b/b2bInvoice.model");
const pincode = require('bharat-pincode');
const distanceBetween = (fromPin, toPin) => {
    const dist = pincode.distanceBetween(fromPin, toPin);
    if (dist == null)
        throw new Error('Unable to calculate distance for the provided pincodes');
    return Number(dist.toFixed(2));
};
const formatOrderNumber = (seq) => {
    const digits = String(seq).padStart(9, '0').slice(-9);
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};
exports.b2bOrderService = {
    async generateLrNo() {
        const count = await b2bOrder_model_1.B2bOrder.countDocuments();
        let seq = count + 1;
        let lrNo = formatOrderNumber(seq);
        while (await b2bOrder_model_1.B2bOrder.exists({ lrNo })) {
            seq += 1;
            lrNo = formatOrderNumber(seq);
        }
        return lrNo;
    },
    async createDraft(userId, payload) {
        const lrNo = await this.generateLrNo();
        const order = await b2bOrder_model_1.B2bOrder.create({
            b2bUserId: userId,
            lrNo,
            waybill: payload.waybill ? String(payload.waybill).trim().toUpperCase() : undefined,
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
        order.status = 'ORDER_CREATED';
        order.selectedVehicleId = vehicle._id;
        order.selectedVehicle = { vehicleType: vehicle.vehicleType, capacityKg: vehicle.capacityKg };
        order.distanceKm = distanceKm;
        order.ratePerKm = vehicle.ratePerKm;
        order.totalAmount = totalAmount;
        await order.save();
        return { success: true, message: 'B2B order confirmed successfully', data: order };
    },
    async assignDriver(orderId, userId, driverId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, message: 'Invalid order ID' };
        if (!mongoose_1.Types.ObjectId.isValid(driverId))
            return { success: false, message: 'Invalid driver ID' };
        const order = await b2bOrder_model_1.B2bOrder.findOne({ _id: orderId, ...(userId ? { b2bUserId: userId } : {}) });
        if (!order)
            return { success: false, message: 'Order not found' };
        const driver = await driver_model_1.Driver.findOne({ _id: driverId, status: 'Active' });
        if (!driver)
            return { success: false, message: 'Active driver not found' };
        order.driverId = driver._id;
        order.driver = {
            driverName: driver.driverName,
            phoneNumber: driver.phoneNumber,
            licenseNumber: driver.licenseNumber,
        };
        await order.save();
        await b2bInvoice_model_1.B2bInvoice.updateOne({ order: order._id }, {
            $set: {
                driver: order.driver,
            },
        });
        return { success: true, message: 'Driver assigned successfully', data: order };
    },
    async updateStatus(orderId, status) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, message: 'Invalid order ID' };
        const normalizedStatus = String(status).trim().toUpperCase();
        if (!b2bOrder_model_1.B2B_ORDER_STATUSES.includes(normalizedStatus)) {
            return { success: false, message: `Status must be one of: ${b2bOrder_model_1.B2B_ORDER_STATUSES.join(', ')}` };
        }
        const order = await b2bOrder_model_1.B2bOrder.findById(orderId);
        if (!order)
            return { success: false, message: 'Order not found' };
        order.status = normalizedStatus;
        await order.save();
        await b2bInvoice_model_1.B2bInvoice.updateOne({ order: order._id }, { $set: { orderStatus: normalizedStatus } });
        return { success: true, message: 'Order status updated successfully', data: order };
    },
    async getById(orderId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId))
            return { success: false, message: 'Invalid order ID' };
        const query = { _id: orderId };
        if (userId)
            query.b2bUserId = userId;
        const order = await b2bOrder_model_1.B2bOrder.findOne(query)
            .populate('selectedVehicleId', 'vehicleType capacityKg ratePerKm status')
            .populate('driverId', 'driverName phoneNumber licenseNumber status');
        if (!order)
            return { success: false, message: 'Order not found' };
        return { success: true, data: order };
    },
    async getDriverOptions(query = {}) {
        const filter = { status: 'Active' };
        if (query.search) {
            const search = String(query.search).trim();
            filter.$or = [
                { driverName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { licenseNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const drivers = await driver_model_1.Driver.find(filter).select('_id driverName').sort({ driverName: 1 });
        return { success: true, data: drivers };
    },
    async list(userId, query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
        const filter = {};
        if (userId)
            filter.b2bUserId = userId;
        if (query.status)
            filter.status = query.status;
        if (query.b2bUserId && !userId && mongoose_1.Types.ObjectId.isValid(String(query.b2bUserId)))
            filter.b2bUserId = query.b2bUserId;
        if (query.orderId && mongoose_1.Types.ObjectId.isValid(String(query.orderId)))
            filter._id = query.orderId;
        if (query.vehicleId && mongoose_1.Types.ObjectId.isValid(String(query.vehicleId)))
            filter.selectedVehicleId = query.vehicleId;
        if (query.bookingPincode)
            filter['bookingCustomer.pincode'] = String(query.bookingPincode);
        if (query.deliveryPincode)
            filter['deliveryCustomer.pincode'] = String(query.deliveryPincode);
        if (query.search) {
            const search = String(query.search).trim();
            filter.$or = [
                { 'bookingCustomer.name': { $regex: search, $options: 'i' } },
                { 'bookingCustomer.phoneNumber': { $regex: search, $options: 'i' } },
                { 'deliveryCustomer.name': { $regex: search, $options: 'i' } },
                { 'deliveryCustomer.phoneNumber': { $regex: search, $options: 'i' } },
                { 'bookingCustomer.pincode': { $regex: search, $options: 'i' } },
                { 'deliveryCustomer.pincode': { $regex: search, $options: 'i' } },
            ];
        }
        if (query.vehicleType)
            filter['selectedVehicle.vehicleType'] = { $regex: String(query.vehicleType), $options: 'i' };
        for (const [minKey, maxKey, field] of [['minWeight', 'maxWeight', 'shipment.approximateWeight'], ['minAmount', 'maxAmount', 'totalAmount'], ['minDistance', 'maxDistance', 'distanceKm']]) {
            if (query[minKey] !== undefined || query[maxKey] !== undefined) {
                filter[field] = {};
                if (query[minKey] !== undefined)
                    filter[field].$gte = Number(query[minKey]);
                if (query[maxKey] !== undefined)
                    filter[field].$lte = Number(query[maxKey]);
            }
        }
        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate)
                filter.createdAt.$gte = new Date(String(query.startDate));
            if (query.endDate) {
                const end = new Date(String(query.endDate));
                end.setDate(end.getDate() + 1);
                filter.createdAt.$lt = end;
            }
        }
        const [orders, total] = await Promise.all([
            b2bOrder_model_1.B2bOrder.find(filter)
                .populate('b2bUserId', 'name mobileNumber gstNumber state pincode status')
                .populate('selectedVehicleId', 'vehicleType capacityKg ratePerKm status')
                .populate('driverId', 'driverName phoneNumber licenseNumber status')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 }),
            b2bOrder_model_1.B2bOrder.countDocuments(filter),
        ]);
        return { success: true, data: { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
    },
};
