import { Schema, model } from 'mongoose';

export interface IVehicle {
  vehicleType: string;
  capacity: string;
  vehicleRegistrationNumber: string;
  rcNumber: string;
  insuranceNumber: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    capacity: {
      type: String,
      required: [true, 'Capacity is required'],
      trim: true,
    },
    vehicleRegistrationNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    rcNumber: {
      type: String,
      required: [true, 'RC number is required'],
      trim: true,
    },
    insuranceNumber: {
      type: String,
      required: [true, 'Insurance number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ status: 1 });

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
