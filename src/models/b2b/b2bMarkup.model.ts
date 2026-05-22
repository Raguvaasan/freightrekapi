import { Schema, model, Types } from 'mongoose';

export interface IB2bMarkup {
  markupCategory: 'rate_calculator' | 'rate_card';
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const b2bMarkupSchema = new Schema<IB2bMarkup>(
  {
    markupCategory: {
      type: String,
      enum: ['rate_calculator', 'rate_card'],
      required: true,
    },
    markupType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    markupValue: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique active markup per category (only one active per category)
b2bMarkupSchema.index(
  { markupCategory: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export const B2bMarkup = model<IB2bMarkup>('B2bMarkup', b2bMarkupSchema);
