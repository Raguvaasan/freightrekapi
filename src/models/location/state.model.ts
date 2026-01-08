import { Schema, model, Types } from 'mongoose';

export interface IState {
  _id: Types.ObjectId;
  name: string;
  countryId: Types.ObjectId;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stateSchema = new Schema<IState>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: 'Country',
      required: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
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

// Compound index for unique state names within a country
stateSchema.index({ name: 1, countryId: 1 }, { unique: true });
stateSchema.index({ countryId: 1, isActive: 1 });

export const State = model<IState>('State', stateSchema);
