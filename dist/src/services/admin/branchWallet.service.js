"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchWalletService = exports.BranchWalletService = void 0;
const mongoose_1 = require("mongoose");
const agency_model_1 = require("../../models/admin/agency.model");
const wallet_model_1 = require("../../models/wallet/wallet.model");
const transaction_model_1 = require("../../models/wallet/transaction.model");
const parcelSettlement_model_1 = require("../../models/admin/parcelSettlement.model");
const walletLedger_1 = require("../../utils/walletLedger");
/** Manual entries are the only ones an admin may later edit or reverse. */
const MANUAL_SOURCES = ['admin_topup', 'admin_deduction'];
const BRANCH_SELECT = 'agencyName agencyOwner phone email city state status profitPercentage ' +
    'loadingChargePercentage miscChargePercentage';
/**
 * The booking charge percentages, reported by the admin wallet endpoints only.
 *
 * They are configuration an admin sets, not something the agency reads back on
 * its own screens — the agency sees the resulting rupee amounts on each order
 * and invoice instead.
 *
 * The same fallbacks calculateCharges uses are applied here: an agency created
 * before these fields existed has neither stored, and a `.lean()` read gets no
 * schema default, so a plain `?? 0` would report 0% on a wallet screen while
 * bookings were charging 10%.
 */
const chargePercentages = (branch) => ({
    loadingChargePercentage: branch.loadingChargePercentage ?? agency_model_1.DEFAULT_LOADING_CHARGE_PERCENTAGE,
    miscChargePercentage: branch.miscChargePercentage ?? agency_model_1.DEFAULT_MISC_CHARGE_PERCENTAGE,
});
/**
 * Admin-side management of branch (franchise) wallets.
 *
 * The admin tops a branch up here; parcel bookings then draw the admin's share
 * out of that balance (see ParcelSettlementService).
 */
class BranchWalletService {
    buildDateRange(dateFrom, dateTo) {
        const range = {};
        if (dateFrom) {
            const from = new Date(dateFrom);
            if (!isNaN(from.getTime()))
                range.$gte = from;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            if (!isNaN(to.getTime())) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo))
                    to.setHours(23, 59, 59, 999);
                range.$lte = to;
            }
        }
        return Object.keys(range).length ? range : null;
    }
    /**
     * Total balance held across every branch wallet.
     *
     * Wallets are keyed by a plain string, so customer and admin wallets live in
     * the same collection — the sum is restricted to Agency ids on purpose.
     */
    async getAllBranchesBalance() {
        const agencies = await agency_model_1.Agency.find({}, '_id').lean();
        const branchIds = agencies.map((a) => a._id.toString());
        if (!branchIds.length)
            return 0;
        const result = await wallet_model_1.Wallet.aggregate([
            { $match: { userId: { $in: branchIds } } },
            { $group: { _id: null, totalBalance: { $sum: '$balance' } } },
        ]);
        return (0, walletLedger_1.round2)(result[0]?.totalBalance || 0);
    }
    async resolveBranch(branchId) {
        if (!mongoose_1.Types.ObjectId.isValid(branchId)) {
            return { error: { success: false, message: 'Invalid branch ID' } };
        }
        const branch = await agency_model_1.Agency.findById(branchId).select(BRANCH_SELECT);
        if (!branch) {
            return { error: { success: false, code: 404, message: 'Branch (franchise) not found' } };
        }
        return { branch };
    }
    /** List every branch with its wallet balance and settlement totals */
    async getAllBranchWallets(filters) {
        try {
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
            const skip = (page - 1) * limit;
            const query = {};
            if (filters.search) {
                query.$or = [
                    { agencyName: { $regex: filters.search, $options: 'i' } },
                    { agencyOwner: { $regex: filters.search, $options: 'i' } },
                    { phone: { $regex: filters.search, $options: 'i' } },
                    { city: { $regex: filters.search, $options: 'i' } },
                ];
            }
            if (filters.status)
                query.status = filters.status;
            const [branches, total] = await Promise.all([
                agency_model_1.Agency.find(query)
                    .select(BRANCH_SELECT)
                    .sort({ agencyName: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                agency_model_1.Agency.countDocuments(query),
            ]);
            const branchIds = branches.map((b) => b._id.toString());
            const [wallets, settlements] = await Promise.all([
                wallet_model_1.Wallet.find({ userId: { $in: branchIds } }).lean(),
                parcelSettlement_model_1.ParcelSettlement.aggregate([
                    {
                        $match: {
                            status: 'settled',
                            agency: { $in: branchIds.map((id) => new mongoose_1.Types.ObjectId(id)) },
                        },
                    },
                    {
                        $group: {
                            _id: '$agency',
                            orders: { $sum: 1 },
                            totalOrderAmount: { $sum: '$orderAmount' },
                            totalBranchProfit: { $sum: '$agencyProfitAmount' },
                            totalAdminShare: { $sum: '$adminShareAmount' },
                        },
                    },
                ]),
            ]);
            const balanceMap = new Map(wallets.map((w) => [w.userId, w.balance]));
            const settlementMap = new Map(settlements.map((s) => [s._id.toString(), s]));
            const data = branches.map((branch) => {
                const id = branch._id.toString();
                const stats = settlementMap.get(id);
                return {
                    branchId: id,
                    agencyName: branch.agencyName,
                    agencyOwner: branch.agencyOwner,
                    phone: branch.phone,
                    email: branch.email,
                    city: branch.city,
                    state: branch.state,
                    status: branch.status,
                    profitPercentage: branch.profitPercentage ?? 0,
                    ...chargePercentages(branch),
                    balance: (0, walletLedger_1.round2)(balanceMap.get(id) ?? 0),
                    currency: 'INR',
                    settledOrders: stats?.orders || 0,
                    totalBookingAmount: (0, walletLedger_1.round2)(stats?.totalOrderAmount || 0),
                    totalProfitEarned: (0, walletLedger_1.round2)(stats?.totalBranchProfit || 0),
                    totalPaidToAdmin: (0, walletLedger_1.round2)(stats?.totalAdminShare || 0),
                };
            });
            // Company-wide total across every branch, not just this page
            const allBranchesBalance = await this.getAllBranchesBalance();
            return {
                success: true,
                data: {
                    wallets: data,
                    totals: {
                        allBranchesBalance,
                    },
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching branch wallets',
            };
        }
    }
    /**
     * One branch's wallet with its profit percentage and settlement totals.
     *
     * `includeChargePercentages` is set by the admin endpoints only — the same
     * method backs the agency's own wallet screen, which must not report them.
     */
    async getBranchWallet(branchId, options = {}) {
        try {
            const resolved = await this.resolveBranch(branchId);
            if (resolved.error)
                return resolved.error;
            const branch = resolved.branch;
            const wallet = await (0, walletLedger_1.ensureWallet)(branchId);
            const stats = await parcelSettlement_model_1.ParcelSettlement.aggregate([
                { $match: { agency: new mongoose_1.Types.ObjectId(branchId), status: 'settled' } },
                {
                    $group: {
                        _id: null,
                        orders: { $sum: 1 },
                        totalOrderAmount: { $sum: '$orderAmount' },
                        totalBranchProfit: { $sum: '$agencyProfitAmount' },
                        totalAdminShare: { $sum: '$adminShareAmount' },
                    },
                },
            ]);
            const totals = stats[0] || {
                orders: 0,
                totalOrderAmount: 0,
                totalBranchProfit: 0,
                totalAdminShare: 0,
            };
            const credited = await transaction_model_1.Transaction.aggregate([
                { $match: { userId: branchId, type: { $in: ['credit', 'refund', 'reversal'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            return {
                success: true,
                data: {
                    branchId,
                    agencyName: branch.agencyName,
                    agencyOwner: branch.agencyOwner,
                    phone: branch.phone,
                    email: branch.email,
                    city: branch.city,
                    state: branch.state,
                    status: branch.status,
                    profitPercentage: branch.profitPercentage ?? 0,
                    ...(options.includeChargePercentages ? chargePercentages(branch) : {}),
                    balance: (0, walletLedger_1.round2)(wallet.balance),
                    currency: wallet.currency || 'INR',
                    totalCredited: (0, walletLedger_1.round2)(credited[0]?.total || 0),
                    settledOrders: totals.orders,
                    totalBookingAmount: (0, walletLedger_1.round2)(totals.totalOrderAmount),
                    totalProfitEarned: (0, walletLedger_1.round2)(totals.totalBranchProfit),
                    totalPaidToAdmin: (0, walletLedger_1.round2)(totals.totalAdminShare),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching branch wallet',
            };
        }
    }
    /**
     * Set the percentages a branch is booked under.
     *
     * All three live together on one wallet screen: the commission the branch
     * keeps, and the loading / miscellaneous charges added on top of the
     * transportation charge at booking time. Every field is optional — send only
     * the ones being changed. They apply to new bookings; settlements and
     * invoices already recorded keep the percentages they were raised under.
     */
    async updatePercentages(branchId, data) {
        try {
            const resolved = await this.resolveBranch(branchId);
            if (resolved.error)
                return resolved.error;
            const branch = await agency_model_1.Agency.findById(branchId);
            if (!branch) {
                return { success: false, code: 404, message: 'Branch (franchise) not found' };
            }
            if (data.profitPercentage === undefined &&
                data.loadingChargePercentage === undefined &&
                data.miscChargePercentage === undefined) {
                return {
                    success: false,
                    message: 'Send at least one of profitPercentage, loadingChargePercentage or miscChargePercentage',
                };
            }
            // Commission only applies to a third-party agency
            if (branch.type === 'Own' && (data.profitPercentage ?? 0) > 0) {
                return {
                    success: false,
                    message: `"${branch.agencyName}" is an Own agency, so no commission is applicable. Change its type to "Third Party" first.`,
                };
            }
            if (data.profitPercentage !== undefined) {
                branch.profitPercentage = data.profitPercentage;
            }
            if (data.loadingChargePercentage !== undefined) {
                branch.loadingChargePercentage = data.loadingChargePercentage;
            }
            if (data.miscChargePercentage !== undefined) {
                branch.miscChargePercentage = data.miscChargePercentage;
            }
            await branch.save();
            return {
                success: true,
                message: `"${branch.agencyName}": commission ${branch.profitPercentage}%, ` +
                    `loading ${branch.loadingChargePercentage}%, miscellaneous ` +
                    `${branch.miscChargePercentage}%. Applies to new bookings.`,
                data: {
                    branchId,
                    agencyName: branch.agencyName,
                    type: branch.type,
                    agencyType: branch.type === 'Own',
                    profitPercentage: branch.profitPercentage,
                    loadingChargePercentage: branch.loadingChargePercentage,
                    miscChargePercentage: branch.miscChargePercentage,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating the percentages',
            };
        }
    }
    /** Admin adds money to a branch wallet */
    async creditBranchWallet(branchId, data, actor) {
        try {
            const resolved = await this.resolveBranch(branchId);
            if (resolved.error)
                return resolved.error;
            const branch = resolved.branch;
            if (branch.status !== 'Active') {
                return {
                    success: false,
                    message: 'Cannot add money to an inactive branch wallet',
                };
            }
            const result = await (0, walletLedger_1.creditWallet)({
                userId: branchId,
                amount: data.amount,
                type: 'credit',
                description: data.remarks || 'Wallet amount added by admin',
                paymentMethod: data.paymentMethod || 'admin_credit',
                metadata: {
                    source: 'admin_topup',
                    reference: data.reference,
                    addedBy: actor.id,
                    addedByName: actor.name,
                    addedByRole: actor.role,
                    branchName: branch.agencyName,
                },
            });
            if (!result.success) {
                return { success: false, code: result.code, message: result.message };
            }
            return {
                success: true,
                message: `₹${(0, walletLedger_1.round2)(data.amount)} added to "${branch.agencyName}" wallet`,
                data: {
                    branchId,
                    agencyName: branch.agencyName,
                    transactionId: result.transactionId,
                    amount: (0, walletLedger_1.round2)(data.amount),
                    balanceBefore: result.balanceBefore,
                    balance: result.balanceAfter,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error adding money to the branch wallet',
            };
        }
    }
    /** Admin deducts money from a branch wallet (manual correction) */
    async debitBranchWallet(branchId, data, actor) {
        try {
            const resolved = await this.resolveBranch(branchId);
            if (resolved.error)
                return resolved.error;
            const branch = resolved.branch;
            const result = await (0, walletLedger_1.debitWallet)({
                userId: branchId,
                amount: data.amount,
                type: 'debit',
                description: data.remarks || 'Wallet amount deducted by admin',
                paymentMethod: data.paymentMethod || 'admin_debit',
                metadata: {
                    source: 'admin_deduction',
                    reference: data.reference,
                    deductedBy: actor.id,
                    deductedByName: actor.name,
                    deductedByRole: actor.role,
                    branchName: branch.agencyName,
                },
            });
            if (!result.success) {
                return { success: false, code: result.code, message: result.message };
            }
            return {
                success: true,
                message: `₹${(0, walletLedger_1.round2)(data.amount)} deducted from "${branch.agencyName}" wallet`,
                data: {
                    branchId,
                    agencyName: branch.agencyName,
                    transactionId: result.transactionId,
                    amount: (0, walletLedger_1.round2)(data.amount),
                    balanceBefore: result.balanceBefore,
                    balance: result.balanceAfter,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deducting money from the branch wallet',
            };
        }
    }
    /** Wallet statement for one branch */
    async getBranchTransactions(branchId, filters) {
        try {
            const resolved = await this.resolveBranch(branchId);
            if (resolved.error)
                return resolved.error;
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
            const skip = (page - 1) * limit;
            const query = { userId: branchId };
            if (filters.type)
                query.type = filters.type;
            const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
            if (range)
                query.createdAt = range;
            const [transactions, total] = await Promise.all([
                transaction_model_1.Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                transaction_model_1.Transaction.countDocuments(query),
            ]);
            const wallet = await (0, walletLedger_1.ensureWallet)(branchId);
            return {
                success: true,
                data: {
                    branchId,
                    agencyName: resolved.branch.agencyName,
                    balance: (0, walletLedger_1.round2)(wallet.balance),
                    transactions: transactions.map((txn) => ({
                        transactionId: txn.transactionId,
                        amount: txn.amount,
                        type: txn.type,
                        status: txn.status,
                        description: txn.description,
                        orderId: txn.orderId,
                        paymentMethod: txn.paymentMethod,
                        balanceBefore: txn.balanceBefore,
                        balanceAfter: txn.balanceAfter,
                        source: txn.metadata?.source,
                        /** Only manual admin entries can be edited or reversed */
                        editable: MANUAL_SOURCES.includes(txn.metadata?.source),
                        metadata: txn.metadata,
                        createdAt: txn.createdAt,
                    })),
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching wallet transactions',
            };
        }
    }
    async getTransactionById(transactionId) {
        try {
            const transaction = await transaction_model_1.Transaction.findOne({ transactionId }).lean();
            if (!transaction) {
                return { success: false, code: 404, message: 'Transaction not found' };
            }
            const branch = await agency_model_1.Agency.findById(transaction.userId).select(BRANCH_SELECT);
            return {
                success: true,
                data: {
                    ...transaction,
                    branchName: branch?.agencyName,
                    editable: MANUAL_SOURCES.includes(transaction.metadata?.source),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching transaction',
            };
        }
    }
    /**
     * Edit the remarks on a manual admin entry.
     *
     * Amounts are never edited in place — a wrong amount is corrected by
     * reversing the entry and adding a fresh one, so the statement stays honest.
     */
    async updateTransactionRemarks(transactionId, remarks, actor) {
        try {
            const transaction = await transaction_model_1.Transaction.findOne({ transactionId });
            if (!transaction) {
                return { success: false, code: 404, message: 'Transaction not found' };
            }
            if (!MANUAL_SOURCES.includes(transaction.metadata?.source)) {
                return {
                    success: false,
                    code: 403,
                    message: 'Only manual admin wallet entries can be edited. Parcel settlement and payment gateway rows are read-only.',
                };
            }
            transaction.description = remarks;
            transaction.metadata = {
                ...(transaction.metadata || {}),
                editedBy: actor.id,
                editedByName: actor.name,
                editedAt: new Date(),
            };
            transaction.markModified('metadata');
            await transaction.save();
            return {
                success: true,
                message: 'Transaction remarks updated successfully',
                data: transaction,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating transaction',
            };
        }
    }
    /**
     * Reverse a manual admin entry.
     *
     * The original row is kept and a matching opposite row is written, so the
     * balance is corrected without a hole in the statement.
     */
    async reverseTransaction(transactionId, actor, reason) {
        try {
            const transaction = await transaction_model_1.Transaction.findOne({ transactionId });
            if (!transaction) {
                return { success: false, code: 404, message: 'Transaction not found' };
            }
            if (!MANUAL_SOURCES.includes(transaction.metadata?.source)) {
                return {
                    success: false,
                    code: 403,
                    message: 'Only manual admin wallet entries can be reversed here. Use the settlement reverse endpoint for parcel settlements.',
                };
            }
            if (transaction.metadata?.reversedBy) {
                return {
                    success: false,
                    code: 409,
                    message: 'This transaction has already been reversed',
                };
            }
            const branchId = transaction.userId;
            const amount = (0, walletLedger_1.round2)(transaction.amount);
            const wasCredit = transaction.type === 'credit';
            const description = `Reversal of ${transactionId}${reason ? ` (${reason})` : ''}`;
            const metadata = {
                source: 'admin_reversal',
                reversalOf: transactionId,
                reason,
                reversedBy: actor.id,
                reversedByName: actor.name,
            };
            // Undo the original direction: a credit is taken back, a debit refunded
            const result = wasCredit
                ? await (0, walletLedger_1.debitWallet)({
                    userId: branchId,
                    amount,
                    type: 'reversal',
                    description,
                    paymentMethod: 'admin_reversal',
                    metadata,
                })
                : await (0, walletLedger_1.creditWallet)({
                    userId: branchId,
                    amount,
                    type: 'reversal',
                    description,
                    paymentMethod: 'admin_reversal',
                    metadata,
                });
            if (!result.success) {
                return { success: false, code: result.code, message: result.message };
            }
            transaction.metadata = {
                ...(transaction.metadata || {}),
                reversedBy: actor.id,
                reversedByName: actor.name,
                reversedAt: new Date(),
                reversalTransactionId: result.transactionId,
                reversalReason: reason,
            };
            transaction.markModified('metadata');
            await transaction.save();
            return {
                success: true,
                message: `₹${amount} entry reversed`,
                data: {
                    branchId,
                    reversedTransactionId: transactionId,
                    reversalTransactionId: result.transactionId,
                    amount,
                    balance: result.balanceAfter,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error reversing transaction',
            };
        }
    }
    /** The admin settlement wallet: everything branches have remitted */
    async getAdminWallet() {
        try {
            const wallet = await (0, walletLedger_1.ensureWallet)(walletLedger_1.ADMIN_WALLET_USER_ID);
            const [settled, allBranchesBalance] = await Promise.all([
                parcelSettlement_model_1.ParcelSettlement.aggregate([
                    { $match: { status: 'settled' } },
                    {
                        $group: {
                            _id: null,
                            orders: { $sum: 1 },
                            totalOrderAmount: { $sum: '$orderAmount' },
                            totalBranchProfit: { $sum: '$agencyProfitAmount' },
                            totalAdminShare: { $sum: '$adminShareAmount' },
                        },
                    },
                ]),
                this.getAllBranchesBalance(),
            ]);
            const totals = settled[0] || {
                orders: 0,
                totalOrderAmount: 0,
                totalBranchProfit: 0,
                totalAdminShare: 0,
            };
            return {
                success: true,
                data: {
                    walletUserId: walletLedger_1.ADMIN_WALLET_USER_ID,
                    balance: (0, walletLedger_1.round2)(wallet.balance),
                    currency: wallet.currency || 'INR',
                    settledOrders: totals.orders,
                    totalBookingAmount: (0, walletLedger_1.round2)(totals.totalOrderAmount),
                    totalBranchProfitGiven: (0, walletLedger_1.round2)(totals.totalBranchProfit),
                    totalReceivedFromBranches: (0, walletLedger_1.round2)(totals.totalAdminShare),
                    allBranchesBalance,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching the admin wallet',
            };
        }
    }
    /** Statement of the admin settlement wallet */
    async getAdminTransactions(filters) {
        try {
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
            const skip = (page - 1) * limit;
            const query = { userId: walletLedger_1.ADMIN_WALLET_USER_ID };
            if (filters.type)
                query.type = filters.type;
            const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
            if (range)
                query.createdAt = range;
            const [transactions, total] = await Promise.all([
                transaction_model_1.Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                transaction_model_1.Transaction.countDocuments(query),
            ]);
            const wallet = await (0, walletLedger_1.ensureWallet)(walletLedger_1.ADMIN_WALLET_USER_ID);
            return {
                success: true,
                data: {
                    balance: (0, walletLedger_1.round2)(wallet.balance),
                    transactions,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching admin wallet transactions',
            };
        }
    }
}
exports.BranchWalletService = BranchWalletService;
exports.branchWalletService = new BranchWalletService();
