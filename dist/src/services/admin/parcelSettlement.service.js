"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parcelSettlementService = exports.ParcelSettlementService = void 0;
const mongoose_1 = require("mongoose");
const parcelOrder_model_1 = require("../../models/admin/parcelOrder.model");
const parcelSettlement_model_1 = require("../../models/admin/parcelSettlement.model");
const agency_model_1 = require("../../models/admin/agency.model");
const transaction_model_1 = require("../../models/wallet/transaction.model");
const parcelCharges_1 = require("../../utils/parcelCharges");
const walletLedger_1 = require("../../utils/walletLedger");
const SETTLEMENT_POPULATE = [
    { path: 'agency', select: 'agencyName agencyOwner phone city state profitPercentage' },
    {
        path: 'order',
        // The whole charge breakdown, so a settlement row shows what the debited
        // amount was worked out from — transport alone does not explain it
        select: 'orderNumber status paymentType transportationCharge loadingChargePercentage ' +
            'loadingCharge miscChargePercentage miscellaneousCharge totalAmount createdAt',
    },
];
/**
 * Wallet settlement for parcel bookings.
 *
 * On every booking the agency's wallet is debited with the *full* booking
 * amount and the admin settlement wallet is credited with the same amount. The
 * agency's commission is not netted off the wallet — it is a payable settled
 * through AgencyPayout (bank transfer), outside the wallet:
 *
 *   ₹200 booking, 10% agency commission -> ₹200 debited from the agency wallet,
 *   ₹20 recorded as commission owed to the agency, ₹180 the admin's share
 *
 * Mongo standalone deployments have no multi-document transactions here, so
 * every step is written to be individually reversible: if the admin credit
 * fails after the agency debit, the agency is refunded immediately.
 */
class ParcelSettlementService {
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
                // Treat a bare date as "up to the end of that day"
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo))
                    to.setHours(23, 59, 59, 999);
                range.$lte = to;
            }
        }
        return Object.keys(range).length ? range : null;
    }
    /**
     * Settle a freshly booked order: debit the agency wallet with the full
     * booking amount and credit the admin settlement wallet.
     *
     * A zero-amount booking still gets a settlement record (with zero amounts)
     * so a later charge update has a document to adjust.
     */
    async settleOrder(order, actor, options = {}) {
        const existing = await parcelSettlement_model_1.ParcelSettlement.findOne({ order: order._id });
        if (existing && existing.status === 'settled') {
            return {
                success: false,
                code: 409,
                message: `Parcel order ${order.orderNumber} is already settled`,
            };
        }
        const agencyId = order.agency?._id
            ? order.agency._id.toString()
            : order.agency.toString();
        const agency = options.agency ||
            (await agency_model_1.Agency.findById(agencyId).select('agencyName profitPercentage type'));
        if (!agency) {
            return { success: false, message: 'Booking agency not found' };
        }
        // The split applies to the total the customer pays (transport + loading +
        // miscellaneous), and an "Own" agency earns no commission at all.
        const split = (0, walletLedger_1.calculateProfitSplit)(order.totalAmount || 0, (0, parcelCharges_1.effectiveCommissionPercentage)(agency));
        let agencyDebitTransactionId;
        let adminCreditTransactionId;
        let agencyBalanceAfter;
        if (split.walletDebitAmount > 0) {
            const debit = await (0, walletLedger_1.debitWallet)({
                userId: agencyId,
                amount: split.walletDebitAmount,
                type: 'debit',
                orderId: order.orderNumber,
                description: `Parcel order ${order.orderNumber} - booking amount ₹${split.orderAmount} (agency commission ${split.profitPercentage}% = ₹${split.agencyProfitAmount}, payable separately)`,
                metadata: {
                    source: 'parcel_settlement',
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    ...split,
                },
            });
            if (!debit.success) {
                return {
                    success: false,
                    code: debit.code || 402,
                    message: debit.message,
                    data: {
                        required: split.walletDebitAmount,
                        available: debit.balanceAfter,
                        split,
                    },
                };
            }
            agencyDebitTransactionId = debit.transactionId;
            agencyBalanceAfter = debit.balanceAfter;
            const credit = await (0, walletLedger_1.creditWallet)({
                userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                amount: split.walletDebitAmount,
                type: 'credit',
                orderId: order.orderNumber,
                description: `Parcel order ${order.orderNumber} - booking amount received from "${agency.agencyName}"`,
                metadata: {
                    source: 'parcel_settlement',
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    agencyId,
                    agencyName: agency.agencyName,
                    ...split,
                },
            });
            if (!credit.success) {
                // Put the agency's money back rather than leaving it in limbo
                await (0, walletLedger_1.creditWallet)({
                    userId: agencyId,
                    amount: split.walletDebitAmount,
                    type: 'reversal',
                    orderId: order.orderNumber,
                    description: `Parcel order ${order.orderNumber} - settlement failed, amount returned`,
                    metadata: {
                        source: 'parcel_settlement_rollback',
                        orderNumber: order.orderNumber,
                        failedTransactionId: agencyDebitTransactionId,
                    },
                });
                return {
                    success: false,
                    message: credit.message || 'Failed to credit the admin settlement wallet',
                };
            }
            adminCreditTransactionId = credit.transactionId;
        }
        const settlementData = {
            order: order._id,
            orderNumber: order.orderNumber,
            agency: agencyId,
            ...split,
            status: 'settled',
            agencyDebitTransactionId,
            adminCreditTransactionId,
            settledAt: new Date(),
            settledBy: actor.id,
            settledByRole: actor.role,
        };
        // A reversed settlement is re-settled in place; the adjustment trail and
        // reversal fields are cleared so the document describes the current state.
        //
        // The unique index on `order` also makes this the point where two
        // concurrent settle calls for the same order collide — the loser must give
        // the agency its money back rather than leave it debited.
        let settlement;
        try {
            settlement = existing
                ? await parcelSettlement_model_1.ParcelSettlement.findByIdAndUpdate(existing._id, {
                    $set: { ...settlementData, adjustments: [] },
                    $unset: {
                        reversedAt: '',
                        reversedBy: '',
                        reversalReason: '',
                        agencyRefundTransactionId: '',
                        adminReversalTransactionId: '',
                    },
                }, { new: true })
                : await parcelSettlement_model_1.ParcelSettlement.create(settlementData);
        }
        catch (error) {
            if (split.walletDebitAmount > 0) {
                await (0, walletLedger_1.creditWallet)({
                    userId: agencyId,
                    amount: split.walletDebitAmount,
                    type: 'reversal',
                    orderId: order.orderNumber,
                    description: `Parcel order ${order.orderNumber} - settlement not recorded, amount returned`,
                    metadata: {
                        source: 'parcel_settlement_rollback',
                        orderNumber: order.orderNumber,
                        failedTransactionId: agencyDebitTransactionId,
                    },
                });
                await (0, walletLedger_1.debitWallet)({
                    userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                    amount: split.walletDebitAmount,
                    type: 'reversal',
                    orderId: order.orderNumber,
                    description: `Parcel order ${order.orderNumber} - settlement not recorded, amount returned`,
                    allowNegative: true,
                    metadata: {
                        source: 'parcel_settlement_rollback',
                        orderNumber: order.orderNumber,
                        failedTransactionId: adminCreditTransactionId,
                    },
                });
            }
            return {
                success: false,
                code: error?.code === 11000 ? 409 : 400,
                message: error?.code === 11000
                    ? `Parcel order ${order.orderNumber} is already settled`
                    : error.message || 'Failed to record the settlement',
            };
        }
        await parcelOrder_model_1.ParcelOrder.findByIdAndUpdate(order._id, {
            $set: {
                walletSettlement: {
                    status: 'settled',
                    ...split,
                    settledAt: settlementData.settledAt,
                },
            },
        });
        return {
            success: true,
            message: `₹${split.walletDebitAmount} debited from the agency wallet; ₹${split.agencyProfitAmount} commission owed to the agency`,
            data: {
                settlement,
                split,
                agencyBalanceAfter,
            },
        };
    }
    /**
     * The booking amount changed after settlement: move only the difference so
     * the agency and admin wallets stay in step with the new booking amount.
     *
     * The agency's commission percentage is deliberately taken from the settlement
     * snapshot, not from the agency's current value, so editing a charge never
     * retro-applies a percentage the booking was not made under.
     */
    async adjustForChargeChange(order, previousAmount, newAmount, actor, note) {
        const settlement = await parcelSettlement_model_1.ParcelSettlement.findOne({ order: order._id });
        if (!settlement || settlement.status !== 'settled') {
            return {
                success: true,
                message: 'No active settlement to adjust',
                data: { adjusted: false },
            };
        }
        const agencyId = settlement.agency.toString();
        const split = (0, walletLedger_1.calculateProfitSplit)(newAmount, settlement.profitPercentage);
        // Compare against what was actually taken from the wallet. Settlements
        // written before the wallet moved the full amount only debited the admin
        // share, so fall back to that for them.
        const previousDebit = (0, walletLedger_1.round2)(settlement.walletDebitAmount ?? settlement.adminShareAmount);
        const delta = (0, walletLedger_1.round2)(split.walletDebitAmount - previousDebit);
        let agencyTransactionId;
        let adminTransactionId;
        if (delta > 0) {
            // Charge went up -> the agency owes the admin more
            const debit = await (0, walletLedger_1.debitWallet)({
                userId: agencyId,
                amount: delta,
                type: 'debit',
                orderId: order.orderNumber,
                description: `Parcel order ${order.orderNumber} - additional booking amount (charge ₹${(0, walletLedger_1.round2)(previousAmount)} -> ₹${split.orderAmount})`,
                metadata: {
                    source: 'parcel_settlement_adjustment',
                    orderNumber: order.orderNumber,
                    previousOrderAmount: (0, walletLedger_1.round2)(previousAmount),
                    newOrderAmount: split.orderAmount,
                    delta,
                },
            });
            if (!debit.success) {
                return {
                    success: false,
                    code: debit.code || 402,
                    message: `${debit.message}. The transportation charge was not changed.`,
                };
            }
            agencyTransactionId = debit.transactionId;
            const credit = await (0, walletLedger_1.creditWallet)({
                userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                amount: delta,
                type: 'credit',
                orderId: order.orderNumber,
                description: `Parcel order ${order.orderNumber} - additional booking amount after charge revision`,
                metadata: {
                    source: 'parcel_settlement_adjustment',
                    orderNumber: order.orderNumber,
                    agencyId,
                    delta,
                },
            });
            if (!credit.success) {
                await (0, walletLedger_1.creditWallet)({
                    userId: agencyId,
                    amount: delta,
                    type: 'reversal',
                    orderId: order.orderNumber,
                    description: `Parcel order ${order.orderNumber} - adjustment failed, amount returned`,
                    metadata: {
                        source: 'parcel_settlement_rollback',
                        orderNumber: order.orderNumber,
                        failedTransactionId: agencyTransactionId,
                    },
                });
                return {
                    success: false,
                    message: credit.message || 'Failed to credit the admin settlement wallet',
                };
            }
            adminTransactionId = credit.transactionId;
        }
        else if (delta < 0) {
            // Charge went down -> refund the difference to the agency
            const amount = Math.abs(delta);
            const adminDebit = await (0, walletLedger_1.debitWallet)({
                userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                amount,
                type: 'reversal',
                orderId: order.orderNumber,
                description: `Parcel order ${order.orderNumber} - booking amount returned after charge revision`,
                allowNegative: true,
                metadata: {
                    source: 'parcel_settlement_adjustment',
                    orderNumber: order.orderNumber,
                    agencyId,
                    delta,
                },
            });
            if (!adminDebit.success) {
                return {
                    success: false,
                    message: adminDebit.message || 'Failed to debit the admin settlement wallet',
                };
            }
            adminTransactionId = adminDebit.transactionId;
            const refund = await (0, walletLedger_1.creditWallet)({
                userId: agencyId,
                amount,
                type: 'refund',
                orderId: order.orderNumber,
                description: `Parcel order ${order.orderNumber} - booking amount refund (charge ₹${(0, walletLedger_1.round2)(previousAmount)} -> ₹${split.orderAmount})`,
                metadata: {
                    source: 'parcel_settlement_adjustment',
                    orderNumber: order.orderNumber,
                    previousOrderAmount: (0, walletLedger_1.round2)(previousAmount),
                    newOrderAmount: split.orderAmount,
                    delta,
                },
            });
            if (!refund.success) {
                await (0, walletLedger_1.creditWallet)({
                    userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                    amount,
                    type: 'reversal',
                    orderId: order.orderNumber,
                    description: `Parcel order ${order.orderNumber} - refund failed, amount restored`,
                    metadata: {
                        source: 'parcel_settlement_rollback',
                        orderNumber: order.orderNumber,
                        failedTransactionId: adminTransactionId,
                    },
                });
                return {
                    success: false,
                    message: refund.message || 'Failed to refund the agency wallet',
                };
            }
            agencyTransactionId = refund.transactionId;
        }
        settlement.orderAmount = split.orderAmount;
        settlement.agencyProfitAmount = split.agencyProfitAmount;
        settlement.adminShareAmount = split.adminShareAmount;
        settlement.walletDebitAmount = split.walletDebitAmount;
        if (delta !== 0) {
            settlement.adjustments.push({
                previousOrderAmount: (0, walletLedger_1.round2)(previousAmount),
                newOrderAmount: split.orderAmount,
                deltaAdminShare: delta,
                agencyTransactionId,
                adminTransactionId,
                adjustedBy: actor.id,
                adjustedByRole: actor.role,
                note,
                adjustedAt: new Date(),
            });
        }
        await settlement.save();
        await parcelOrder_model_1.ParcelOrder.findByIdAndUpdate(order._id, {
            $set: {
                'walletSettlement.orderAmount': split.orderAmount,
                'walletSettlement.agencyProfitAmount': split.agencyProfitAmount,
                'walletSettlement.adminShareAmount': split.adminShareAmount,
                'walletSettlement.walletDebitAmount': split.walletDebitAmount,
            },
        });
        return {
            success: true,
            message: delta === 0
                ? 'Charge updated; the wallet amount is unchanged'
                : delta > 0
                    ? `Charge updated; ₹${delta} additionally debited from the agency wallet`
                    : `Charge updated; ₹${Math.abs(delta)} refunded to the agency wallet`,
            data: { adjusted: delta !== 0, delta, split, settlement },
        };
    }
    /**
     * Undo a settlement by parcel order id.
     *
     * A missing settlement is not an error here: this is the path the order
     * delete flow takes, and an order booked before the wallet flow existed
     * simply has nothing to reverse. The API endpoint uses
     * `reverseSettlementById`, which reports a missing record as 404.
     */
    async reverseSettlement(orderId, actor, reason) {
        // Never query on a blank id — `{ order: undefined }` would silently match
        // the wrong document set instead of failing
        if (!orderId || !mongoose_1.Types.ObjectId.isValid(orderId)) {
            return { success: false, message: 'Invalid order ID' };
        }
        const settlement = await parcelSettlement_model_1.ParcelSettlement.findOne({ order: orderId });
        if (!settlement) {
            return {
                success: true,
                message: 'No settlement recorded for this order',
                data: { reversed: false },
            };
        }
        return this.applyReversal(settlement, actor, reason);
    }
    /**
     * Undo a settlement by its own id — what the reverse endpoint calls.
     *
     * Looking the settlement up directly means a deleted parcel order (whose
     * populated `order` is null) can still be reversed.
     */
    async reverseSettlementById(settlementId, actor, reason) {
        if (!mongoose_1.Types.ObjectId.isValid(settlementId)) {
            return { success: false, message: 'Invalid settlement ID' };
        }
        const settlement = await parcelSettlement_model_1.ParcelSettlement.findById(settlementId);
        if (!settlement) {
            return { success: false, code: 404, message: 'Settlement not found' };
        }
        return this.applyReversal(settlement, actor, reason);
    }
    /** Shared reversal mechanics for both lookup paths */
    async applyReversal(settlement, actor, reason) {
        if (settlement.status === 'reversed') {
            return {
                success: false,
                code: 409,
                message: `Settlement for ${settlement.orderNumber} is already reversed`,
            };
        }
        const agencyId = settlement.agency.toString();
        // Refund exactly what the settlement took out of the wallet; older records
        // predate the full-amount debit and only moved the admin share.
        const amount = (0, walletLedger_1.round2)(settlement.walletDebitAmount ?? settlement.adminShareAmount);
        let agencyRefundTransactionId;
        let adminReversalTransactionId;
        if (amount > 0) {
            // Take it out of the admin wallet first; allowNegative keeps a reversal
            // from being blocked by a temporarily low settlement balance.
            const adminDebit = await (0, walletLedger_1.debitWallet)({
                userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                amount,
                type: 'reversal',
                orderId: settlement.orderNumber,
                description: `Parcel order ${settlement.orderNumber} - settlement reversed`,
                allowNegative: true,
                metadata: {
                    source: 'parcel_settlement_reversal',
                    orderNumber: settlement.orderNumber,
                    agencyId,
                    reason,
                },
            });
            if (!adminDebit.success) {
                return {
                    success: false,
                    message: adminDebit.message || 'Failed to debit the admin settlement wallet',
                };
            }
            adminReversalTransactionId = adminDebit.transactionId;
            const refund = await (0, walletLedger_1.creditWallet)({
                userId: agencyId,
                amount,
                type: 'refund',
                orderId: settlement.orderNumber,
                description: `Parcel order ${settlement.orderNumber} - booking amount refunded${reason ? ` (${reason})` : ''}`,
                metadata: {
                    source: 'parcel_settlement_reversal',
                    orderNumber: settlement.orderNumber,
                    reason,
                },
            });
            if (!refund.success) {
                await (0, walletLedger_1.creditWallet)({
                    userId: walletLedger_1.ADMIN_WALLET_USER_ID,
                    amount,
                    type: 'credit',
                    orderId: settlement.orderNumber,
                    description: `Parcel order ${settlement.orderNumber} - reversal failed, amount restored`,
                    metadata: {
                        source: 'parcel_settlement_rollback',
                        orderNumber: settlement.orderNumber,
                        failedTransactionId: adminReversalTransactionId,
                    },
                });
                return {
                    success: false,
                    message: refund.message || 'Failed to refund the agency wallet',
                };
            }
            agencyRefundTransactionId = refund.transactionId;
        }
        settlement.status = 'reversed';
        settlement.reversedAt = new Date();
        settlement.reversedBy = actor.id;
        settlement.reversalReason = reason;
        settlement.agencyRefundTransactionId = agencyRefundTransactionId;
        settlement.adminReversalTransactionId = adminReversalTransactionId;
        await settlement.save();
        // A no-op when the parcel order has already been deleted
        await parcelOrder_model_1.ParcelOrder.findByIdAndUpdate(settlement.order, {
            $set: { 'walletSettlement.status': 'reversed' },
        });
        return {
            success: true,
            message: amount > 0
                ? `₹${amount} refunded to the agency wallet`
                : 'Settlement reversed (no amount was moved)',
            data: { reversed: true, amount, settlement },
        };
    }
    /** Settle an order that has no settlement yet (or re-settle a reversed one) */
    async settleOrderById(orderId, actor) {
        if (!mongoose_1.Types.ObjectId.isValid(orderId)) {
            return { success: false, message: 'Invalid order ID' };
        }
        const order = await parcelOrder_model_1.ParcelOrder.findById(orderId);
        if (!order) {
            return { success: false, code: 404, message: 'Parcel order not found' };
        }
        return this.settleOrder(order, actor);
    }
    async getAllSettlements(filters, scope = {}) {
        try {
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
            const skip = (page - 1) * limit;
            const query = {};
            if (scope.agencyId) {
                query.agency = scope.agencyId;
            }
            else if (filters.agency && mongoose_1.Types.ObjectId.isValid(filters.agency)) {
                query.agency = filters.agency;
            }
            if (filters.status)
                query.status = filters.status;
            if (filters.orderNumber) {
                query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
            }
            const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
            if (range)
                query.settledAt = range;
            const [settlements, total, totals] = await Promise.all([
                parcelSettlement_model_1.ParcelSettlement.find(query)
                    .populate(SETTLEMENT_POPULATE)
                    .sort({ settledAt: -1 })
                    .skip(skip)
                    .limit(limit),
                parcelSettlement_model_1.ParcelSettlement.countDocuments(query),
                parcelSettlement_model_1.ParcelSettlement.aggregate([
                    { $match: { ...query, status: 'settled' } },
                    {
                        $group: {
                            _id: null,
                            totalOrderAmount: { $sum: '$orderAmount' },
                            totalAgencyProfit: { $sum: '$agencyProfitAmount' },
                            totalAdminShare: { $sum: '$adminShareAmount' },
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);
            const summary = totals[0] || {
                totalOrderAmount: 0,
                totalAgencyProfit: 0,
                totalAdminShare: 0,
                count: 0,
            };
            return {
                success: true,
                data: {
                    settlements,
                    totals: {
                        settledCount: summary.count,
                        totalOrderAmount: (0, walletLedger_1.round2)(summary.totalOrderAmount),
                        totalAgencyProfit: (0, walletLedger_1.round2)(summary.totalAgencyProfit),
                        totalAdminShare: (0, walletLedger_1.round2)(summary.totalAdminShare),
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
                message: error.message || 'Error fetching settlements',
            };
        }
    }
    async getSettlementById(id, scope = {}) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid settlement ID' };
            }
            const settlement = await parcelSettlement_model_1.ParcelSettlement.findById(id).populate(SETTLEMENT_POPULATE);
            if (!settlement) {
                return { success: false, code: 404, message: 'Settlement not found' };
            }
            const agencyRef = settlement.agency;
            const agencyId = agencyRef?._id ? agencyRef._id.toString() : agencyRef?.toString();
            if (scope.agencyId && agencyId !== scope.agencyId) {
                return {
                    success: false,
                    code: 403,
                    message: 'This settlement belongs to another agency',
                };
            }
            // The wallet rows that carried this settlement, for a full audit trail
            const transactionIds = [
                settlement.agencyDebitTransactionId,
                settlement.adminCreditTransactionId,
                settlement.agencyRefundTransactionId,
                settlement.adminReversalTransactionId,
                ...settlement.adjustments.flatMap((a) => [
                    a.agencyTransactionId,
                    a.adminTransactionId,
                ]),
            ].filter(Boolean);
            const transactions = transactionIds.length
                ? await transaction_model_1.Transaction.find({ transactionId: { $in: transactionIds } })
                    .sort({ createdAt: 1 })
                    .lean()
                : [];
            return { success: true, data: { settlement, transactions } };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching settlement',
            };
        }
    }
    async updateSettlementNotes(id, notes) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid settlement ID' };
            }
            const settlement = await parcelSettlement_model_1.ParcelSettlement.findByIdAndUpdate(id, { $set: { notes } }, { new: true }).populate(SETTLEMENT_POPULATE);
            if (!settlement) {
                return { success: false, code: 404, message: 'Settlement not found' };
            }
            return {
                success: true,
                message: 'Settlement notes updated successfully',
                data: settlement,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating settlement notes',
            };
        }
    }
    /** Admin earnings, overall and per agency */
    async getSummary(filters) {
        try {
            const match = { status: 'settled' };
            if (filters.agency && mongoose_1.Types.ObjectId.isValid(filters.agency)) {
                match.agency = new mongoose_1.Types.ObjectId(filters.agency);
            }
            const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
            if (range)
                match.settledAt = range;
            const [overall, perAgency] = await Promise.all([
                parcelSettlement_model_1.ParcelSettlement.aggregate([
                    { $match: match },
                    {
                        $group: {
                            _id: null,
                            orders: { $sum: 1 },
                            totalOrderAmount: { $sum: '$orderAmount' },
                            totalAgencyProfit: { $sum: '$agencyProfitAmount' },
                            totalAdminShare: { $sum: '$adminShareAmount' },
                        },
                    },
                ]),
                parcelSettlement_model_1.ParcelSettlement.aggregate([
                    { $match: match },
                    {
                        $group: {
                            _id: '$agency',
                            orders: { $sum: 1 },
                            totalOrderAmount: { $sum: '$orderAmount' },
                            totalAgencyProfit: { $sum: '$agencyProfitAmount' },
                            totalAdminShare: { $sum: '$adminShareAmount' },
                        },
                    },
                    {
                        $lookup: {
                            from: 'agencies',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'agency',
                        },
                    },
                    { $unwind: { path: '$agency', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            agencyId: '$_id',
                            agencyName: '$agency.agencyName',
                            profitPercentage: '$agency.profitPercentage',
                            orders: 1,
                            totalOrderAmount: { $round: ['$totalOrderAmount', 2] },
                            totalAgencyProfit: { $round: ['$totalAgencyProfit', 2] },
                            totalAdminShare: { $round: ['$totalAdminShare', 2] },
                        },
                    },
                    { $sort: { totalAdminShare: -1 } },
                ]),
            ]);
            const totals = overall[0] || {
                orders: 0,
                totalOrderAmount: 0,
                totalAgencyProfit: 0,
                totalAdminShare: 0,
            };
            const reversed = await parcelSettlement_model_1.ParcelSettlement.aggregate([
                { $match: { ...match, status: 'reversed' } },
                { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$adminShareAmount' } } },
            ]);
            return {
                success: true,
                data: {
                    settledOrders: totals.orders,
                    totalOrderAmount: (0, walletLedger_1.round2)(totals.totalOrderAmount),
                    totalAgencyProfit: (0, walletLedger_1.round2)(totals.totalAgencyProfit),
                    totalAdminShare: (0, walletLedger_1.round2)(totals.totalAdminShare),
                    reversedOrders: reversed[0]?.count || 0,
                    reversedAmount: (0, walletLedger_1.round2)(reversed[0]?.amount || 0),
                    perAgency,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error building settlement summary',
            };
        }
    }
}
exports.ParcelSettlementService = ParcelSettlementService;
exports.parcelSettlementService = new ParcelSettlementService();
