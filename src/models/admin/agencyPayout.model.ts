import { Schema, model, Types } from 'mongoose';

export const PAYOUT_STATUSES = ['paid', 'reversed'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/**
 * A commission payment made by admin to an agency.
 *
 * An agency earns a share of every booking it makes (ParcelSettlement
 * .agencyProfitAmount). That commission is money the company owes it, and it is
 * settled by bank transfer outside this system — so a payout is recorded here
 * and no wallet moves. The agency wallet is a prepaid float for booking; mixing
 * a commission payment into it would make the balance mean two things.
 *
 * Payments are lump sums against the running balance, not tied to one order:
 *   remaining = sum(agencyProfitAmount, settled) - sum(payouts, paid)
 */
export interface IAgencyPayout {
  agency: Types.ObjectId;
  amount: number;
  /** Free text: bank transfer, cash, UPI ... */
  paymentMethod?: string;
  /** NEFT/UTR number or whatever identifies the transfer */
  reference?: string;
  remarks?: string;

  status: PayoutStatus;

  /** What the agency was owed at the moment this payment was recorded */
  profitAtPayment: number;
  paidBeforeThis: number;

  paidAt: Date;
  paidBy?: string;
  paidByName?: string;

  reversedAt?: Date;
  reversedBy?: string;
  reversalReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const agencyPayoutSchema = new Schema<IAgencyPayout>(
  {
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payout amount must be greater than 0'],
    },
    paymentMethod: { type: String, trim: true },
    reference: { type: String, trim: true },
    remarks: { type: String, trim: true },

    status: {
      type: String,
      enum: PAYOUT_STATUSES,
      default: 'paid',
    },

    // Snapshotted so a statement row still explains itself after later bookings
    // have moved the totals on
    profitAtPayment: { type: Number, default: 0 },
    paidBeforeThis: { type: Number, default: 0 },

    paidAt: { type: Date, default: Date.now },
    paidBy: { type: String },
    paidByName: { type: String, trim: true },

    reversedAt: { type: Date },
    reversedBy: { type: String },
    reversalReason: { type: String, trim: true },
  },
  { timestamps: true }
);

agencyPayoutSchema.index({ agency: 1, paidAt: -1 });
agencyPayoutSchema.index({ status: 1 });

export const AgencyPayout = model<IAgencyPayout>('AgencyPayout', agencyPayoutSchema);
