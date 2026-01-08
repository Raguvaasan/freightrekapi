import { Schema, model, Types } from 'mongoose';

export interface ICity {
  _id: Types.ObjectId;
  name: string;
  stateId: Types.ObjectId;
  pincode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    stateId: {
      type: Schema.Types.ObjectId,
      ref: 'State',
      required: true
    },
    pincode: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique city names within a state
citySchema.index({ name: 1, stateId: 1 }, { unique: true });
citySchema.index({ stateId: 1, isActive: 1 });

export const City = model<ICity>('City', citySchema);
