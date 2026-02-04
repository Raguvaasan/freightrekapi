import { Schema, model } from 'mongoose';

export interface ITransaction {
  transactionId: string;
  userId: string;
  orderId?: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund' | 'reversal';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  paymentMethod?: string;
  paymentId?: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: any;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
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
    orderId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'refund', 'reversal'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    description: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create compound index for user transaction history
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
