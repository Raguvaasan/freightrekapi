import { Schema, model, Types } from 'mongoose';

export interface IWallet {
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  { timestamps: true }
);

export const Wallet = model<IWallet>('Wallet', walletSchema);
