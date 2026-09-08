import { Types } from 'mongoose';
import { B2bOrder, B2B_ORDER_STATUSES, B2bOrderStatus } from '../../models/b2b/b2bOrder.model';
import { B2bVehicle } from '../../models/b2b/b2bVehicle.model';
import { Driver } from '../../models/admin/driver.model';
import { B2bInvoice } from '../../models/b2b/b2bInvoice.model';

const pincode: any = require('bharat-pincode');

const distanceBetween = (fromPin: string, toPin: string) => {
  const normalizedFromPin = String(fromPin || '').replace(/\D/g, '');
  const normalizedToPin = String(toPin || '').replace(/\D/g, '');
  const dist = pincode.distanceBetween(normalizedFromPin, normalizedToPin);
  if (dist == null) throw new Error('Unable to calculate distance for the provided pincodes');
  return Math.max(1, Number(dist.toFixed(2)));
};

const formatOrderNumber = (seq: number) => {
  const digits = String(seq).padStart(9, '0').slice(-9);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const b2bOrderService = {
  async generateLrNo() {
    const count = await B2bOrder.countDocuments();
    let seq = count + 1;
    let lrNo = formatOrderNumber(seq);
    while (await B2bOrder.exists({ lrNo })) {
      seq += 1;
      lrNo = formatOrderNumber(seq);
    }
    return lrNo;
  },
  async createDraft(userId: string, payload: any) {
    const lrNo = await this.generateLrNo();
    const order = await B2bOrder.create({
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
    const ratePerKm = Number(vehicle.ratePerKm);
    if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) return { success: false, message: 'Vehicle rate per km must be greater than zero' };
    const totalAmount = Number((distanceKm * ratePerKm).toFixed(2));
    order.distanceKm = distanceKm;
    order.ratePerKm = ratePerKm;
    order.totalAmount = totalAmount;
    return {
      success: true,
      data: {
        order,
        vehicle,
        distanceKm,
        ratePerKm,
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
    const ratePerKm = Number(vehicle.ratePerKm);
    if (!Number.isFinite(ratePerKm)) return { success: false, message: 'Vehicle rate per km is invalid' };
    const totalAmount = Number((distanceKm * ratePerKm).toFixed(2));
    order.status = 'ORDER_CREATED';
    order.selectedVehicleId = vehicle._id as Types.ObjectId;
    order.selectedVehicle = {
      vehicleType: vehicle.vehicleType,
      registrationNumber: vehicle.registrationNumber,
      insuranceNumber: vehicle.insuranceNumber,
      rcNumber: vehicle.rcNumber,
      capacityKg: vehicle.capacityKg,
      ratePerKm,
      status: vehicle.status,
    };
    order.distanceKm = distanceKm;
    order.ratePerKm = vehicle.ratePerKm;
    order.totalAmount = totalAmount;
    await order.save();
    return { success: true, message: 'B2B order confirmed successfully', data: order };
  },
  async assignDriver(orderId: string, userId: string | undefined, driverId: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    if (!Types.ObjectId.isValid(driverId)) return { success: false, message: 'Invalid driver ID' };
    const order = await B2bOrder.findOne({ _id: orderId, ...(userId ? { b2bUserId: userId } : {}) });
    if (!order) return { success: false, message: 'Order not found' };
    const driver = await Driver.findOne({ _id: driverId, status: 'Active' });
    if (!driver) return { success: false, message: 'Active driver not found' };
    order.driverId = driver._id as Types.ObjectId;
    order.driver = {
      driverName: driver.driverName,
      phoneNumber: driver.phoneNumber,
      licenseNumber: driver.licenseNumber,
    };
    await order.save();
    await B2bInvoice.updateOne(
      { order: order._id },
      {
        $set: {
          driver: order.driver,
        },
      }
    );
    return { success: true, message: 'Driver assigned successfully', data: order };
  },
  async assignVehicle(orderId: string, vehicleId: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    if (!Types.ObjectId.isValid(vehicleId)) return { success: false, message: 'Invalid vehicle ID' };
    const order = await B2bOrder.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };
    const vehicle = await B2bVehicle.findOne({ _id: vehicleId, status: 'Active' });
    if (!vehicle) return { success: false, message: 'Active vehicle not found' };
    const ratePerKm = Number(vehicle.ratePerKm);
    if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) {
      return { success: false, message: 'Vehicle rate per km must be greater than zero' };
    }
    const distanceKm = distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
    const totalAmount = Number((distanceKm * ratePerKm).toFixed(2));

    order.selectedVehicleId = vehicle._id as Types.ObjectId;
    order.selectedVehicle = {
      vehicleType: vehicle.vehicleType,
      registrationNumber: vehicle.registrationNumber,
      insuranceNumber: vehicle.insuranceNumber,
      rcNumber: vehicle.rcNumber,
      capacityKg: vehicle.capacityKg,
      ratePerKm: vehicle.ratePerKm,
      status: vehicle.status,
    };
    order.distanceKm = distanceKm;
    order.ratePerKm = ratePerKm;
    order.totalAmount = totalAmount;
    await order.save();
    await B2bInvoice.updateOne(
      { order: order._id },
      {
        $set: {
          vehicle: order.selectedVehicle,
          'charges.transportationCharge': totalAmount,
          'charges.totalAmount': totalAmount,
        },
      }
    );
    await order.populate('selectedVehicleId', 'vehicleType registrationNumber insuranceNumber rcNumber capacityKg ratePerKm status');
    return { success: true, message: 'Vehicle assigned successfully', data: order };
  },
  async updateStatus(orderId: string, status: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    const normalizedStatus = String(status).trim().toUpperCase() as B2bOrderStatus;
    if (!B2B_ORDER_STATUSES.includes(normalizedStatus)) {
      return { success: false, message: `Status must be one of: ${B2B_ORDER_STATUSES.join(', ')}` };
    }
    const order = await B2bOrder.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };
    order.status = normalizedStatus;
    await order.save();
    await B2bInvoice.updateOne({ order: order._id }, { $set: { orderStatus: normalizedStatus } });
    return { success: true, message: 'Order status updated successfully', data: order };
  },
  async getById(orderId: string, userId?: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    const query: any = { _id: orderId };
    if (userId) query.b2bUserId = userId;
    const order = await B2bOrder.findOne(query)
      .populate('selectedVehicleId', 'vehicleType registrationNumber insuranceNumber rcNumber capacityKg ratePerKm status')
      .populate('driverId', 'driverName phoneNumber licenseNumber status');
    if (!order) return { success: false, message: 'Order not found' };
    return { success: true, data: order };
  },
  async getDriverOptions(query: any = {}) {
    const filter: any = { status: 'Active' };
    if (query.search) {
      const search = String(query.search).trim();
      filter.$or = [
        { driverName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const drivers = await Driver.find(filter).select('_id driverName').sort({ driverName: 1 });
    return { success: true, data: drivers };
  },
  async getVehicleOptions(query: any = {}) {
    const filter: any = { status: 'Active' };
    if (query.search) {
      filter.vehicleType = { $regex: String(query.search).trim(), $options: 'i' };
    }
    const vehicles = await B2bVehicle.find(filter)
      .select('_id vehicleType')
      .sort({ vehicleType: 1 });
    return { success: true, data: vehicles };
  },
  async list(userId?: string, query: any = {}) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const filter: any = {};
    if (userId) filter.b2bUserId = userId;
    if (query.status) {
      const status = String(query.status).trim();
      filter.status = status.startsWith('!')
        ? { $ne: status.slice(1).trim() }
        : status;
    }
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
        .populate('selectedVehicleId', 'vehicleType registrationNumber insuranceNumber rcNumber capacityKg ratePerKm status')
        .populate('driverId', 'driverName phoneNumber licenseNumber status')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      B2bOrder.countDocuments(filter),
    ]);
    return { success: true, data: { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
  },
};
