import { Schema, model } from 'mongoose';

export interface IDriver {
  driverName: string;
  phoneNumber: string;
  licenseNumber: string;
  dateOfExpiry: Date;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    dateOfExpiry: {
      type: Date,
      required: [true, 'Date of expiry is required'],
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

driverSchema.index({ status: 1 });

export const Driver = model<IDriver>('Driver', driverSchema);
