import { Wallet } from '../models/wallet/wallet.model';
import { Transaction } from '../models/wallet/transaction.model';

/**
 * The company (admin) settlement account.
 *
 * Wallets are keyed by a plain `userId` string, so the admin side of every
 * parcel settlement lands on this single fixed key instead of on one of the
 * (possibly many) AdminUser records. Franchise wallets keep using the Agency
 * `_id` as their key, exactly as the Cashfree recharge flow already does.
 */
export const ADMIN_WALLET_USER_ID = 'ADMIN';

export type LedgerEntryType = 'credit' | 'debit' | 'refund' | 'reversal';

export interface LedgerInput {
  /** Agency `_id` for a branch wallet, or ADMIN_WALLET_USER_ID */
  userId: string;
  /** Always a positive number; the direction comes from `type` */
  amount: number;
  type: LedgerEntryType;
  description: string;
  /** Parcel order number / recharge order id shown on the statement */
  orderId?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
  /**
   * Allow the balance to go below zero. Used only for the admin settlement
   * account, where a reversal must never be blocked by a low balance.
   */
  allowNegative?: boolean;
}

export interface LedgerResult {
  success: boolean;
  message?: string;
  /** HTTP status the caller should surface (402 = insufficient balance) */
  code?: number;
  transactionId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

/** Money is stored in rupees; keep everything at 2 decimals. */
export const round2 = (value: number): number =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

let txnCounter = 0;
const nextTransactionId = (userId: string): string => {
  txnCounter = (txnCounter + 1) % 100000;
  return `TXN_${Date.now()}_${txnCounter}_${userId}`;
};

/** Find or create a wallet without changing its balance. */
export const ensureWallet = async (userId: string) =>
  (await Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, balance: 0, currency: 'INR' } },
    { new: true, upsert: true, lean: true }
  ))!;

/**
 * Add money to a wallet and write the matching statement row.
 * The wallet is created on first use.
 */
export const creditWallet = async (input: LedgerInput): Promise<LedgerResult> => {
  const amount = round2(input.amount);

  if (!(amount > 0)) {
    return { success: false, code: 400, message: 'Amount must be greater than 0' };
  }

  // Create the wallet first so the increment always lands on an existing
  // document — an upsert that both $inc's and defaults `balance` would be
  // writing the same path twice.
  await ensureWallet(input.userId);

  const wallet = (await Wallet.findOneAndUpdate(
    { userId: input.userId },
    { $inc: { balance: amount } },
    { new: true }
  ))!;

  const balanceAfter = round2(wallet.balance);
  const balanceBefore = round2(balanceAfter - amount);

  const transaction = await Transaction.create({
    transactionId: nextTransactionId(input.userId),
    userId: input.userId,
    orderId: input.orderId,
    amount,
    type: input.type,
    status: 'completed',
    description: input.description,
    paymentMethod: input.paymentMethod || 'wallet',
    balanceBefore,
    balanceAfter,
    metadata: input.metadata,
  });

  return {
    success: true,
    transactionId: transaction.transactionId,
    balanceBefore,
    balanceAfter,
  };
};

/**
 * Take money out of a wallet and write the matching statement row.
 *
 * The balance check and the decrement happen in one atomic `findOneAndUpdate`,
 * so two concurrent bookings can never push a branch wallet below zero.
 */
export const debitWallet = async (input: LedgerInput): Promise<LedgerResult> => {
  const amount = round2(input.amount);

  if (!(amount > 0)) {
    return { success: false, code: 400, message: 'Amount must be greater than 0' };
  }

  await ensureWallet(input.userId);

  const filter: any = { userId: input.userId };
  if (!input.allowNegative) {
    filter.balance = { $gte: amount };
  }

  const wallet = await Wallet.findOneAndUpdate(
    filter,
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!wallet) {
    const current = await ensureWallet(input.userId);
    return {
      success: false,
      code: 402,
      message: `Insufficient wallet balance. Required ₹${amount}, available ₹${round2(
        current.balance
      )}`,
      balanceBefore: round2(current.balance),
      balanceAfter: round2(current.balance),
    };
  }

  const balanceAfter = round2(wallet.balance);
  const balanceBefore = round2(balanceAfter + amount);

  const transaction = await Transaction.create({
    transactionId: nextTransactionId(input.userId),
    userId: input.userId,
    orderId: input.orderId,
    amount,
    type: input.type,
    status: 'completed',
    description: input.description,
    paymentMethod: input.paymentMethod || 'wallet',
    balanceBefore,
    balanceAfter,
    metadata: input.metadata,
  });

  return {
    success: true,
    transactionId: transaction.transactionId,
    balanceBefore,
    balanceAfter,
  };
};

export interface ProfitSplit {
  orderAmount: number;
  profitPercentage: number;
  /** The agency's commission — owed to the agency, paid out separately */
  agencyProfitAmount: number;
  /** Booking value net of the agency commission */
  adminShareAmount: number;
  /**
   * What actually leaves the branch wallet at booking: the whole order value.
   *
   * The commission is not netted off here — it is a payable settled through
   * AgencyPayout (bank transfer), so the wallet float always moves by the full
   * amount the customer is charged.
   */
  walletDebitAmount: number;
}

/**
 * Split a parcel order amount between the branch and the admin.
 *
 * ₹200 order at a 10% branch profit percentage -> ₹20 commission owed to the
 * branch, ₹180 admin share — and the full ₹200 is debited from the branch
 * wallet.
 */
export const calculateProfitSplit = (
  orderAmount: number,
  profitPercentage: number
): ProfitSplit => {
  const amount = round2(orderAmount || 0);
  const percentage = Math.min(Math.max(Number(profitPercentage) || 0, 0), 100);
  const agencyProfitAmount = round2((amount * percentage) / 100);

  return {
    orderAmount: amount,
    profitPercentage: percentage,
    agencyProfitAmount,
    adminShareAmount: round2(amount - agencyProfitAmount),
    walletDebitAmount: amount,
  };
};
