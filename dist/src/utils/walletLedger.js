"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProfitSplit = exports.debitWallet = exports.creditWallet = exports.ensureWallet = exports.round2 = exports.ADMIN_WALLET_USER_ID = void 0;
const wallet_model_1 = require("../models/wallet/wallet.model");
const transaction_model_1 = require("../models/wallet/transaction.model");
/**
 * The company (admin) settlement account.
 *
 * Wallets are keyed by a plain `userId` string, so the admin side of every
 * parcel settlement lands on this single fixed key instead of on one of the
 * (possibly many) AdminUser records. Franchise wallets keep using the Agency
 * `_id` as their key, exactly as the Cashfree recharge flow already does.
 */
exports.ADMIN_WALLET_USER_ID = 'ADMIN';
/** Money is stored in rupees; keep everything at 2 decimals. */
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
exports.round2 = round2;
let txnCounter = 0;
const nextTransactionId = (userId) => {
    txnCounter = (txnCounter + 1) % 100000;
    return `TXN_${Date.now()}_${txnCounter}_${userId}`;
};
/** Find or create a wallet without changing its balance. */
const ensureWallet = async (userId) => (await wallet_model_1.Wallet.findOneAndUpdate({ userId }, { $setOnInsert: { userId, balance: 0, currency: 'INR' } }, { new: true, upsert: true, lean: true }));
exports.ensureWallet = ensureWallet;
/**
 * Add money to a wallet and write the matching statement row.
 * The wallet is created on first use.
 */
const creditWallet = async (input) => {
    const amount = (0, exports.round2)(input.amount);
    if (!(amount > 0)) {
        return { success: false, code: 400, message: 'Amount must be greater than 0' };
    }
    // Create the wallet first so the increment always lands on an existing
    // document — an upsert that both $inc's and defaults `balance` would be
    // writing the same path twice.
    await (0, exports.ensureWallet)(input.userId);
    const wallet = (await wallet_model_1.Wallet.findOneAndUpdate({ userId: input.userId }, { $inc: { balance: amount } }, { new: true }));
    const balanceAfter = (0, exports.round2)(wallet.balance);
    const balanceBefore = (0, exports.round2)(balanceAfter - amount);
    const transaction = await transaction_model_1.Transaction.create({
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
exports.creditWallet = creditWallet;
/**
 * Take money out of a wallet and write the matching statement row.
 *
 * The balance check and the decrement happen in one atomic `findOneAndUpdate`,
 * so two concurrent bookings can never push a branch wallet below zero.
 */
const debitWallet = async (input) => {
    const amount = (0, exports.round2)(input.amount);
    if (!(amount > 0)) {
        return { success: false, code: 400, message: 'Amount must be greater than 0' };
    }
    await (0, exports.ensureWallet)(input.userId);
    const filter = { userId: input.userId };
    if (!input.allowNegative) {
        filter.balance = { $gte: amount };
    }
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate(filter, { $inc: { balance: -amount } }, { new: true });
    if (!wallet) {
        const current = await (0, exports.ensureWallet)(input.userId);
        return {
            success: false,
            code: 402,
            message: `Insufficient wallet balance. Required ₹${amount}, available ₹${(0, exports.round2)(current.balance)}`,
            balanceBefore: (0, exports.round2)(current.balance),
            balanceAfter: (0, exports.round2)(current.balance),
        };
    }
    const balanceAfter = (0, exports.round2)(wallet.balance);
    const balanceBefore = (0, exports.round2)(balanceAfter + amount);
    const transaction = await transaction_model_1.Transaction.create({
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
exports.debitWallet = debitWallet;
/**
 * Split a parcel order amount between the branch and the admin.
 *
 * ₹200 order at a 10% branch profit percentage -> ₹20 commission owed to the
 * branch, ₹180 admin share — and the full ₹200 is debited from the branch
 * wallet.
 */
const calculateProfitSplit = (orderAmount, profitPercentage) => {
    const amount = (0, exports.round2)(orderAmount || 0);
    const percentage = Math.min(Math.max(Number(profitPercentage) || 0, 0), 100);
    const agencyProfitAmount = (0, exports.round2)((amount * percentage) / 100);
    return {
        orderAmount: amount,
        profitPercentage: percentage,
        agencyProfitAmount,
        adminShareAmount: (0, exports.round2)(amount - agencyProfitAmount),
        walletDebitAmount: amount,
    };
};
exports.calculateProfitSplit = calculateProfitSplit;
