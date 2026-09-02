import { Types } from 'mongoose';
import { B2bOrder } from '../../models/b2b/b2bOrder.model';
import { B2bVehicle } from '../../models/b2b/b2bVehicle.model';

const pincode: any = require('bharat-pincode');

const distanceBetween = (fromPin: string, toPin: string) => {
  const dist = pincode.distanceBetween(fromPin, toPin);
  if (dist == null) throw new Error('Unable to calculate distance for the provided pincodes');
  return Number(dist.toFixed(2));
};

export const b2bOrderService = {
  async createDraft(userId: string, payload: any) {
    const order = await B2bOrder.create({
      b2bUserId: userId,
      status: 'DRAFT',
      bookingCustomer: payload.bookingCustomer,
      deliveryCustomer: payload.deliveryCustomer,
      shipment: { approximateWeight: Number(payload.approximateWeight) },
    });
    return { success: true, message: 'Order draft created successfully', data: order };
  },
  async getDraftStep2Details(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid draft ID' };
    const order = await B2bOrder.findOne({ _id: orderId, b2bUserId: userId });
    if (!order) return { success: false, message: 'Draft not found' };
    const vehicle = await B2bVehicle.findOne({
      status: 'Active',
      capacityKg: { $gte: order.shipment.approximateWeight },
    }).sort({ capacityKg: 1, ratePerKm: 1 });
    if (!vehicle) return { success: false, message: 'No suitable vehicle found' };
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
  async confirm(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid draft ID' };
    const order = await B2bOrder.findOne({ _id: orderId, b2bUserId: userId });
    if (!order) return { success: false, message: 'Draft not found' };
    const vehicle = await B2bVehicle.findOne({
      status: 'Active',
      capacityKg: { $gte: order.shipment.approximateWeight },
    }).sort({ capacityKg: 1, ratePerKm: 1 });
    if (!vehicle) return { success: false, message: 'No suitable vehicle found' };
    const distanceKm = distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
    const totalAmount = Number((distanceKm * vehicle.ratePerKm).toFixed(2));
    order.status = 'CONFIRMED';
    order.selectedVehicleId = vehicle._id as Types.ObjectId;
    order.selectedVehicle = { vehicleType: vehicle.vehicleType, capacityKg: vehicle.capacityKg };
    order.distanceKm = distanceKm;
    order.ratePerKm = vehicle.ratePerKm;
    order.totalAmount = totalAmount;
    await order.save();
    return { success: true, message: 'B2B order confirmed successfully', data: order };
  },
  async getById(orderId: string, userId?: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    const query: any = { _id: orderId };
    if (userId) query.b2bUserId = userId;
    const order = await B2bOrder.findOne(query).populate('selectedVehicleId');
    if (!order) return { success: false, message: 'Order not found' };
    return { success: true, data: order };
  },
  async list(userId?: string, query: any = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const filter: any = {};
    if (userId) filter.b2bUserId = userId;
    if (query.status) filter.status = query.status;
    if (query.b2bUserId && !userId && Types.ObjectId.isValid(String(query.b2bUserId))) filter.b2bUserId = query.b2bUserId;
    if (query.orderId && Types.ObjectId.isValid(String(query.orderId))) filter._id = query.orderId;
    if (query.vehicleId && Types.ObjectId.isValid(String(query.vehicleId))) filter.selectedVehicleId = query.vehicleId;
    if (query.bookingPincode) filter['bookingCustomer.pincode'] = String(query.bookingPincode);
    if (query.deliveryPincode) filter['deliveryCustomer.pincode'] = String(query.deliveryPincode);
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
    if (query.vehicleType) filter['selectedVehicle.vehicleType'] = { $regex: String(query.vehicleType), $options: 'i' };
    for (const [minKey, maxKey, field] of [['minWeight', 'maxWeight', 'shipment.approximateWeight'], ['minAmount', 'maxAmount', 'totalAmount'], ['minDistance', 'maxDistance', 'distanceKm']]) {
      if (query[minKey] !== undefined || query[maxKey] !== undefined) {
        filter[field] = {};
        if (query[minKey] !== undefined) filter[field].$gte = Number(query[minKey]);
        if (query[maxKey] !== undefined) filter[field].$lte = Number(query[maxKey]);
      }
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(String(query.startDate));
      if (query.endDate) { const end = new Date(String(query.endDate)); end.setDate(end.getDate() + 1); filter.createdAt.$lt = end; }
    }
    const [orders, total] = await Promise.all([
      B2bOrder.find(filter)
        .populate('b2bUserId', 'name mobileNumber gstNumber state pincode status')
        .populate('selectedVehicleId', 'vehicleType capacityKg ratePerKm status')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      B2bOrder.countDocuments(filter),
    ]);
    return { success: true, data: { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
  },
};
