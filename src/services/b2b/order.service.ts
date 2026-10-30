import { Types } from 'mongoose';
import axios from 'axios';
import { B2bOrder, B2B_ORDER_STATUSES, B2bOrderStatus } from '../../models/b2b/b2bOrder.model';
import { B2bVehicle } from '../../models/b2b/b2bVehicle.model';
import { Vehicle } from '../../models/admin/vehicle.model';
import { Driver } from '../../models/admin/driver.model';
import { B2bInvoice } from '../../models/b2b/b2bInvoice.model';

const GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const distanceBetween = async (fromPin: string, toPin: string): Promise<number> => {
  const normalizedFromPin = String(fromPin || '').replace(/\D/g, '');
  const normalizedToPin = String(toPin || '').replace(/\D/g, '');
  const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();

  if (!/^\d{6}$/.test(normalizedFromPin) || !/^\d{6}$/.test(normalizedToPin)) {
    throw new Error('Booking and delivery pincodes must each contain 6 digits');
  }
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      GOOGLE_ROUTES_API_URL,
      {
        origin: { address: `${normalizedFromPin}, India` },
        destination: { address: `${normalizedToPin}, India` },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      },
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters',
        },
        timeout: 10000,
      },
    );

    const distanceMeters = Number(response.data?.routes?.[0]?.distanceMeters);
    if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
      throw new Error('Google Maps did not return a driving distance for the provided pincodes');
    }
    return Math.max(1, Number((distanceMeters / 1000).toFixed(2)));
  } catch (error: any) {
    if (error instanceof Error && !axios.isAxiosError(error)) throw error;
    const message = error.response?.data?.error?.message;
    throw new Error(message ? `Google Maps distance lookup failed: ${message}` : 'Google Maps distance lookup failed');
  }
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
    const vehicles = await B2bVehicle.find({
      status: 'Active',
      capacityKg: { $gte: order.shipment.approximateWeight },
    }).sort({ capacityKg: 1, ratePerKm: 1 });
    if (!vehicles.length) return { success: false, message: 'No suitable vehicle found' };
    const distanceKm = await distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
    const vehicleOptions = vehicles
      .map((vehicle) => {
        const ratePerKm = Number(vehicle.ratePerKm);
        if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) return null;
        return {
          vehicle,
          distanceKm,
          ratePerKm,
          totalAmount: Number((distanceKm * ratePerKm).toFixed(2)),
        };
      })
      .filter(Boolean);
    if (!vehicleOptions.length) return { success: false, message: 'No suitable vehicle with a valid rate per km found' };
    return {
      success: true,
      data: {
        order,
        distanceKm,
        vehicleOptions,
        userSelectedVehicle: order.userSelectedVehicle || null,
      },
    };
  },
  async confirm(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid draft ID' };
    const order = await B2bOrder.findOne({ _id: orderId, b2bUserId: userId });
    if (!order) return { success: false, message: 'Draft not found' };
    if (!order.userSelectedVehicle?.vehicleId) return { success: false, message: 'Please select a vehicle before confirming the order' };
    const vehicle = await B2bVehicle.findOne({
      _id: order.userSelectedVehicle.vehicleId,
      status: 'Active',
      capacityKg: { $gte: order.shipment.approximateWeight },
    });
    if (!vehicle) return { success: false, message: 'The selected vehicle is no longer available for this shipment' };
    const distanceKm = await distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
    const ratePerKm = Number(vehicle.ratePerKm);
    if (!Number.isFinite(ratePerKm)) return { success: false, message: 'Vehicle rate per km is invalid' };
    const totalAmount = Number((distanceKm * ratePerKm).toFixed(2));
    order.status = 'ORDER_CREATED';
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
  async assignVehicle(orderId: string, vehicleId: string, userId?: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    if (!Types.ObjectId.isValid(vehicleId)) return { success: false, message: 'Invalid vehicle ID' };
    const order = await B2bOrder.findOne({ _id: orderId, ...(userId ? { b2bUserId: userId } : {}) });
    if (!order) return { success: false, message: 'Order not found' };
    if (userId && order.status !== 'DRAFT') return { success: false, message: 'A vehicle can only be selected while the order is a draft' };
    const vehicle = await B2bVehicle.findOne({
      _id: vehicleId,
      status: 'Active',
      capacityKg: { $gte: order.shipment.approximateWeight },
    });
    if (!vehicle) return { success: false, message: 'The selected vehicle is not available for this shipment weight' };
    const ratePerKm = Number(vehicle.ratePerKm);
    if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) {
      return { success: false, message: 'Vehicle rate per km must be greater than zero' };
    }
    const distanceKm = await distanceBetween(order.bookingCustomer.pincode, order.deliveryCustomer.pincode);
    const totalAmount = Number((distanceKm * ratePerKm).toFixed(2));

    const vehicleDetails = {
      vehicleType: vehicle.vehicleType,
      capacityKg: vehicle.capacityKg,
      ratePerKm,
      status: vehicle.status,
    };
    order.distanceKm = distanceKm;
    order.totalAmount = totalAmount;

    if (userId) {
      order.userSelectedVehicle = { vehicleId: vehicle._id as Types.ObjectId, ...vehicleDetails };
      order.selectedVehicleId = undefined;
      order.ratePerKm = ratePerKm;
      await order.save();
      await B2bOrder.updateOne({ _id: order._id }, { $unset: { selectedVehicle: 1, selectedVehicleId: 1 } });
      const updatedOrder = await B2bOrder.findById(order._id);
      return { success: true, message: 'Vehicle selected successfully', data: updatedOrder };
    }

    order.selectedVehicleId = vehicle._id as Types.ObjectId;
    order.status = 'VEHICLE_ASSIGNED';
    order.ratePerKm = ratePerKm;
    await order.save();
    await B2bOrder.updateOne({ _id: order._id }, { $unset: { selectedVehicle: 1 } });
    await B2bInvoice.updateOne(
      { order: order._id },
      {
        $set: {
          vehicle: vehicleDetails,
          'charges.transportationCharge': totalAmount,
          'charges.totalAmount': totalAmount,
        },
      }
    );
    const updatedOrder = await B2bOrder.findById(order._id).populate('selectedVehicleId', 'vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status');
    return { success: true, message: 'Vehicle assigned successfully', data: updatedOrder };
  },
  async assignAdminVehicle(orderId: string, vehicleId: string) {
    if (!Types.ObjectId.isValid(orderId)) return { success: false, message: 'Invalid order ID' };
    if (!Types.ObjectId.isValid(vehicleId)) return { success: false, message: 'Invalid vehicle ID' };

    const order = await B2bOrder.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'Active' });
    if (!vehicle) return { success: false, message: 'Active admin vehicle not found' };

    const capacityKg = Number(String(vehicle.capacity).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(capacityKg) || capacityKg < order.shipment.approximateWeight) {
      return { success: false, message: 'The selected vehicle is not available for this shipment weight' };
    }

    const vehicleDetails = {
      vehicleType: vehicle.vehicleType,
      registrationNumber: vehicle.vehicleRegistrationNumber,
      insuranceNumber: vehicle.insuranceNumber,
      rcNumber: vehicle.rcNumber,
      capacityKg,
      ratePerKm: order.ratePerKm,
      status: vehicle.status,
    };
    order.selectedVehicleId = vehicle._id as Types.ObjectId;
    order.status = 'VEHICLE_ASSIGNED';
    await order.save();
    await B2bInvoice.updateOne(
      { order: order._id },
      { $set: { vehicle: vehicleDetails } }
    );

    const updatedOrder = await B2bOrder.findById(order._id)
      .populate('selectedVehicleId', 'vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status');
    return { success: true, message: 'Vehicle assigned successfully', data: updatedOrder };
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
      .populate('selectedVehicleId', 'vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status')
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
  async getAdminVehicleOptions(query: any = {}) {
    const filter: any = { status: 'Active' };
    if (query.search) {
      filter.$or = [
        { vehicleType: { $regex: String(query.search).trim(), $options: 'i' } },
        { vehicleRegistrationNumber: { $regex: String(query.search).trim(), $options: 'i' } },
      ];
    }
    const vehicles = await Vehicle.find(filter)
      .select('_id vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status')
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
        { 'deliveryCustomer.companyName': { $regex: search, $options: 'i' } },
        { 'deliveryCustomer.phoneNumber': { $regex: search, $options: 'i' } },
        { 'deliveryCustomer.gstNumber': { $regex: search, $options: 'i' } },
        { 'bookingCustomer.pincode': { $regex: search, $options: 'i' } },
        { 'deliveryCustomer.pincode': { $regex: search, $options: 'i' } },
      ];
    }
    if (query.vehicleType) {
      const matchingVehicleIds = await Vehicle.find({ vehicleType: { $regex: String(query.vehicleType), $options: 'i' } }).distinct('_id');
      filter.selectedVehicleId = { $in: matchingVehicleIds };
    }
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
        .populate('selectedVehicleId', 'vehicleType capacity vehicleRegistrationNumber rcNumber insuranceNumber status')
        .populate('driverId', 'driverName phoneNumber licenseNumber status')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      B2bOrder.countDocuments(filter),
    ]);
    return { success: true, data: { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
  },
};
