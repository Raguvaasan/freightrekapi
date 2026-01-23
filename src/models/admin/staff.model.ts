import { Schema, model, Types } from 'mongoose';

export interface IStaff {
  name: string;
  email: string;
  phone: string;
  type: 'head_quarter' | 'franchise';
  roleId?: Types.ObjectId;
  status: 'Active' | 'Inactive';
  franchiseId?: Types.ObjectId;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['head_quarter', 'franchise'],
      required: [true, 'Type is required'],
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'AdminRole',
      required: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: false,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
staffSchema.index({ email: 1 });
staffSchema.index({ username: 1 });
staffSchema.index({ franchiseId: 1 });
staffSchema.index({ roleId: 1 });
staffSchema.index({ status: 1 });

export const Staff = model<IStaff>('Staff', staffSchema);
