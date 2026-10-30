import { Schema, model, Types } from 'mongoose';

export const B2B_ORDER_STATUSES = ['DRAFT', 'CONFIRMED', 'ORDER_CREATED', 'VEHICLE_ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'] as const;
export type B2bOrderStatus = (typeof B2B_ORDER_STATUSES)[number];

export interface IB2bOrder {
  b2bUserId: Types.ObjectId;
  lrNo?: string;
  waybill?: string;
  status: B2bOrderStatus;
  bookingCustomer: {
    name: string;
    phoneNumber: string;
    address: string;
    pincode: string;
  };
  deliveryCustomer: {
    name: string;
    companyName?: string;
    phoneNumber: string;
    address: string;
    pincode: string;
    gstNumber?: string;
  };
  shipment: {
    approximateWeight: number;
  };
  driverId?: Types.ObjectId;
  driver?: {
    driverName: string;
    phoneNumber?: string;
    licenseNumber?: string;
  };
  selectedVehicleId?: Types.ObjectId;
  userSelectedVehicle?: {
    vehicleId: Types.ObjectId;
    vehicleType: string;
    registrationNumber?: string;
    insuranceNumber?: string;
    rcNumber?: string;
    capacityKg: number;
    ratePerKm?: number;
    status?: string;
  };
  distanceKm?: number;
  ratePerKm?: number;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const b2bOrderSchema = new Schema<IB2bOrder>(
  {
    b2bUserId: { type: Schema.Types.ObjectId, ref: 'B2bUser', required: true, index: true },
    lrNo: { type: String, trim: true, uppercase: true, index: true, unique: true, sparse: true },
    waybill: { type: String, trim: true, uppercase: true },
    status: { type: String, enum: B2B_ORDER_STATUSES, default: 'DRAFT', index: true },
    bookingCustomer: {
      name: { type: String, required: true, trim: true },
      phoneNumber: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    deliveryCustomer: {
      name: { type: String, required: true, trim: true },
      companyName: { type: String, trim: true },
      phoneNumber: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      gstNumber: { type: String, trim: true, uppercase: true },
    },
    shipment: {
      approximateWeight: { type: Number, required: true, min: 0 },
    },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    driver: {
      driverName: { type: String, trim: true },
      phoneNumber: { type: String, trim: true },
      licenseNumber: { type: String, trim: true, uppercase: true },
    },
    selectedVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    userSelectedVehicle: {
      vehicleId: { type: Schema.Types.ObjectId, ref: 'B2bVehicle' },
      vehicleType: { type: String },
      registrationNumber: { type: String, trim: true, uppercase: true },
      insuranceNumber: { type: String, trim: true, uppercase: true },
      rcNumber: { type: String, trim: true, uppercase: true },
      capacityKg: { type: Number },
    },
    distanceKm: { type: Number, min: 0 },
    ratePerKm: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

export const B2bOrder = model<IB2bOrder>('B2bOrder', b2bOrderSchema);
