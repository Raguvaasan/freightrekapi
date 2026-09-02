import { Types } from 'mongoose';
import { B2bVehicle } from '../../models/b2b/b2bVehicle.model';

const toNumber = (value: any) => Number(String(value).replace(/[^0-9.]/g, ''));

export const b2bVehicleService = {
  async create(payload: any) {
    const vehicle = await B2bVehicle.create({
      vehicleType: payload.vehicleType,
      capacityKg: toNumber(payload.capacity),
      ratePerKm: Number(payload.ratePerKm),
      status: payload.status || 'Active',
    });
    return { success: true, message: 'B2B vehicle created successfully', data: vehicle };
  },
  async list(query: any) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const search = String(query.search || '').trim();
    const status = String(query.status || '').trim();
    const mongoQuery: any = {};
    if (search) mongoQuery.$or = [{ vehicleType: { $regex: search, $options: 'i' } }];
    if (status) mongoQuery.status = status;
    const [vehicles, total] = await Promise.all([
      B2bVehicle.find(mongoQuery).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      B2bVehicle.countDocuments(mongoQuery),
    ]);
    return { success: true, data: { vehicles, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
  },
  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid vehicle ID' };
    const vehicle = await B2bVehicle.findById(id);
    if (!vehicle) return { success: false, message: 'Vehicle not found' };
    return { success: true, data: vehicle };
  },
  async update(id: string, payload: any) {
    if (!Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid vehicle ID' };
    const vehicle = await B2bVehicle.findByIdAndUpdate(id, {
      ...(payload.vehicleType !== undefined ? { vehicleType: payload.vehicleType } : {}),
      ...(payload.capacity !== undefined ? { capacityKg: toNumber(payload.capacity) } : {}),
      ...(payload.ratePerKm !== undefined ? { ratePerKm: Number(payload.ratePerKm) } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    }, { new: true });
    if (!vehicle) return { success: false, message: 'Vehicle not found' };
    return { success: true, message: 'B2B vehicle updated successfully', data: vehicle };
  },
  async deactivate(id: string) {
    if (!Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid vehicle ID' };
    const vehicle = await B2bVehicle.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });
    if (!vehicle) return { success: false, message: 'Vehicle not found' };
    return { success: true, message: 'B2B vehicle deactivated successfully', data: vehicle };
  },
  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid vehicle ID' };
    const vehicle = await B2bVehicle.findByIdAndDelete(id);
    if (!vehicle) return { success: false, message: 'Vehicle not found' };
    return { success: true, message: 'B2B vehicle deleted successfully' };
  },
};
