import { Schema, model } from 'mongoose';

export interface IAppCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const appCustomerSchema = new Schema<IAppCustomer>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// Compound unique index: same phone number can exist under different country codes
appCustomerSchema.index({ phone: 1, countryCode: 1 }, { unique: true });

export const AppCustomer = model<IAppCustomer>('AppCustomer', appCustomerSchema);
