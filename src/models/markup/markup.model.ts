import { Schema, model, Types } from 'mongoose';

export interface IMarkup {
  markupCategory: 'rate_calculator' | 'rate_card';
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  userId?: Types.ObjectId;
  franchiseId?: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const markupSchema = new Schema<IMarkup>(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      default: null,
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

// Compound index for efficient queries and uniqueness
markupSchema.index(
  { markupCategory: 1, userId: 1, franchiseId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Index for priority-based queries
markupSchema.index({ markupCategory: 1, isActive: 1 });

export const Markup = model<IMarkup>('Markup', markupSchema);
