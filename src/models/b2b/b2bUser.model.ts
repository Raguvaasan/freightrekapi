import { Schema, model } from 'mongoose';

export interface IB2bUser {
  name: string;
  mobileNumber: string;
  address: string;
  state: string;
  pincode: string;
  gstNumber: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const b2bUserSchema = new Schema<IB2bUser>(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true, unique: true, index: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    gstNumber: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export const B2bUser = model<IB2bUser>('B2bUser', b2bUserSchema);
