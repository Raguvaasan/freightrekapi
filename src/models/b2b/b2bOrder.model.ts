import { Schema, model, Types } from 'mongoose';

export interface IB2bOrder {
  b2bUserId: Types.ObjectId;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  bookingCustomer: {
    name: string;
    phoneNumber: string;
    address: string;
    pincode: string;
  };
  deliveryCustomer: {
    name: string;
    phoneNumber: string;
    address: string;
    pincode: string;
  };
  shipment: {
    approximateWeight: number;
  };
  selectedVehicleId?: Types.ObjectId;
  selectedVehicle?: {
    vehicleType: string;
    capacityKg: number;
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
    status: { type: String, enum: ['DRAFT', 'CONFIRMED', 'CANCELLED'], default: 'DRAFT', index: true },
    bookingCustomer: {
      name: { type: String, required: true, trim: true },
      phoneNumber: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    deliveryCustomer: {
      name: { type: String, required: true, trim: true },
      phoneNumber: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    shipment: {
      approximateWeight: { type: Number, required: true, min: 0 },
    },
    selectedVehicleId: { type: Schema.Types.ObjectId, ref: 'B2bVehicle' },
    selectedVehicle: {
      vehicleType: { type: String },
      capacityKg: { type: Number },
    },
    distanceKm: { type: Number, min: 0 },
    ratePerKm: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

export const B2bOrder = model<IB2bOrder>('B2bOrder', b2bOrderSchema);
