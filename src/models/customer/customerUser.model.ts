import { Schema, model } from 'mongoose';

export interface ICustomerUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: Date;
  updatedAt: Date;
}

const customerUserSchema = new Schema<ICustomerUser>(
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
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

export const CustomerUser = model<ICustomerUser>('CustomerUser', customerUserSchema);
