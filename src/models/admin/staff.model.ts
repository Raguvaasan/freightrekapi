import { Schema, model, Types } from 'mongoose';

export interface IStaff {
  name: string;
  email: string;
  phone: string;
  type: 'head_quarter' | 'franchise' | 'hub' | 'b2b' | 'collection_agency';
  roleId?: Types.ObjectId;
  status: 'Active' | 'Inactive';
  franchiseId?: Types.ObjectId;
  hubId?: Types.ObjectId;
  collectionAgencyId?: Types.ObjectId;
  username?: string;
  password?: string;
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
    // Optional since users are created phone-first: several users can share an
    // agency, each identified by their own phone number and logging in by OTP.
    // `sparse` keeps the unique index from tripping over multiple missing values.
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['head_quarter', 'franchise', 'hub', 'b2b', 'collection_agency'],
      required: [true, 'Type is required'],
    },
    roleId: {
      type: Schema.Types.ObjectId,
      required: false,
      // No fixed ref - can be AdminRole or FranchiseRole
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
    hubId: {
      type: Schema.Types.ObjectId,
      ref: 'Hub',
      required: false,
    },
    collectionAgencyId: {
      type: Schema.Types.ObjectId,
      ref: 'CollectionAgency',
      required: false,
    },
    // Username/password stay supported for the existing password logins, but a
    // phone-only user needs neither
    username: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries.
// email / username / phone are already indexed by their `unique` declaration,
// so they are not repeated here.
staffSchema.index({ franchiseId: 1 });
staffSchema.index({ hubId: 1 });
staffSchema.index({ collectionAgencyId: 1 });
staffSchema.index({ roleId: 1 });
staffSchema.index({ status: 1 });

export const Staff = model<IStaff>('Staff', staffSchema);
