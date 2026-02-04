import { Schema, model } from 'mongoose';

export interface IOrder {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet';
  type: string;
  sessionId?: string;
  paymentId?: string;
  cashfreeOrderId?: string;
  metadata?: any;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet'],
      required: true,
    },
    type: {
      type: String,
      default: 'wallet_recharge',
    },
    sessionId: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    cashfreeOrderId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    completedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create compound index for user queries
orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
