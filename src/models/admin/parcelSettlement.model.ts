import { Schema, model, Types } from 'mongoose';

export const SETTLEMENT_STATUSES = ['settled', 'reversed'] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

/** One entry per charge change after the order was first settled. */
interface ISettlementAdjustment {
  previousOrderAmount: number;
  newOrderAmount: number;
  /** Positive -> extra debited from the agency wallet, negative -> refunded */
  deltaAdminShare: number;
  agencyTransactionId?: string;
  adminTransactionId?: string;
  adjustedBy?: string;
  adjustedByRole?: string;
  note?: string;
  adjustedAt: Date;
}

/**
 * The money side of a parcel order: how a booking amount was split between the
 * booking agency and the admin, and which wallet rows carried it.
 *
 * One document per parcel order (unique index on `order`), so a booking can
 * never be settled twice.
 */
export interface IParcelSettlement {
  order: Types.ObjectId;
  orderNumber: string;
  agency: Types.ObjectId;

  orderAmount: number;
  /** Snapshot of the agency's commission percentage at booking time */
  profitPercentage: number;
  agencyProfitAmount: number;
  adminShareAmount: number;
  /**
   * What was actually debited from the agency wallet — the full order value.
   * Absent on settlements written before the wallet debited the whole amount,
   * where the debit was `adminShareAmount`.
   */
  walletDebitAmount?: number;

  status: SettlementStatus;

  /** Wallet statement rows created by the settlement */
  agencyDebitTransactionId?: string;
  adminCreditTransactionId?: string;

  adjustments: ISettlementAdjustment[];

  settledAt: Date;
  settledBy?: string;
  settledByRole?: string;

  reversedAt?: Date;
  reversedBy?: string;
  reversalReason?: string;
  agencyRefundTransactionId?: string;
  adminReversalTransactionId?: string;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const adjustmentSchema = new Schema<ISettlementAdjustment>(
  {
    previousOrderAmount: { type: Number, required: true },
    newOrderAmount: { type: Number, required: true },
    deltaAdminShare: { type: Number, required: true },
    agencyTransactionId: { type: String },
    adminTransactionId: { type: String },
    adjustedBy: { type: String },
    adjustedByRole: { type: String },
    note: { type: String, trim: true },
    adjustedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const parcelSettlementSchema = new Schema<IParcelSettlement>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'ParcelOrder',
      required: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },

    orderAmount: {
      type: Number,
      required: true,
      min: [0, 'Order amount cannot be negative'],
    },
    profitPercentage: {
      type: Number,
      required: true,
      min: [0, 'Profit percentage cannot be negative'],
      max: [100, 'Profit percentage cannot exceed 100'],
    },
    agencyProfitAmount: {
      type: Number,
      required: true,
      min: [0, 'Agency profit cannot be negative'],
    },
    adminShareAmount: {
      type: Number,
      required: true,
      min: [0, 'Admin share cannot be negative'],
    },
    walletDebitAmount: {
      type: Number,
      min: [0, 'Wallet debit amount cannot be negative'],
    },

    status: {
      type: String,
      enum: SETTLEMENT_STATUSES,
      default: 'settled',
    },

    agencyDebitTransactionId: { type: String },
    adminCreditTransactionId: { type: String },

    adjustments: {
      type: [adjustmentSchema],
      default: [],
    },

    settledAt: { type: Date, default: Date.now },
    settledBy: { type: String },
    settledByRole: { type: String },

    reversedAt: { type: Date },
    reversedBy: { type: String },
    reversalReason: { type: String, trim: true },
    agencyRefundTransactionId: { type: String },
    adminReversalTransactionId: { type: String },

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

parcelSettlementSchema.index({ agency: 1, createdAt: -1 });
parcelSettlementSchema.index({ status: 1 });
parcelSettlementSchema.index({ orderNumber: 1 });

export const ParcelSettlement = model<IParcelSettlement>(
  'ParcelSettlement',
  parcelSettlementSchema
);
