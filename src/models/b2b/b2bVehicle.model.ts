import { Schema, model } from 'mongoose';

export interface IB2bVehicle {
  vehicleType: string;
  capacityKg: number;
  ratePerKm: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const b2bVehicleSchema = new Schema<IB2bVehicle>(
  {
    vehicleType: { type: String, required: true, trim: true },
    capacityKg: { type: Number, required: true, min: 0 },
    ratePerKm: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

b2bVehicleSchema.index({ status: 1, capacityKg: 1 });

export const B2bVehicle = model<IB2bVehicle>('B2bVehicle', b2bVehicleSchema);
