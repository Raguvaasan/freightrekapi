import { Schema, model } from 'mongoose';

export interface ICollectionAgency {
  collectionAgencyName: string;
  ownerName: string;
  phone: string;
  status: 'Active' | 'Inactive';
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  username?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectionAgencySchema = new Schema<ICollectionAgency>(
  {
    collectionAgencyName: {
      type: String,
      required: [true, 'Collection agency name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
collectionAgencySchema.index({ collectionAgencyName: 1 });
collectionAgencySchema.index({ status: 1 });

export const CollectionAgency = model<ICollectionAgency>(
  'CollectionAgency',
  collectionAgencySchema
);
