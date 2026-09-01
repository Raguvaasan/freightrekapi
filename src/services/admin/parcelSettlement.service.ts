import { Types } from 'mongoose';
import { ParcelOrder } from '../../models/admin/parcelOrder.model';
import { ParcelSettlement } from '../../models/admin/parcelSettlement.model';
import { Agency } from '../../models/admin/agency.model';
import { Transaction } from '../../models/wallet/transaction.model';
import { ParcelActor } from '../../utils/parcelActor';
import { effectiveCommissionPercentage } from '../../utils/parcelCharges';
import {
  ADMIN_WALLET_USER_ID,
  calculateProfitSplit,
  creditWallet,
  debitWallet,
  round2,
} from '../../utils/walletLedger';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  code?: number;
}

interface SettlementListFilters {
  page?: number;
  limit?: number;
  agency?: string;
  status?: string;
  orderNumber?: string;
  dateFrom?: string;
  dateTo?: string;
}

const SETTLEMENT_POPULATE = [
  { path: 'agency', select: 'agencyName agencyOwner phone city state profitPercentage' },
  {
    path: 'order',
    // The whole charge breakdown, so a settlement row shows what the debited
    // amount was worked out from — transport alone does not explain it
    select:
      'orderNumber status paymentType transportationCharge loadingChargePercentage ' +
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
export class ParcelSettlementService {
  private buildDateRange(dateFrom?: string, dateTo?: string) {
    const range: any = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) range.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        // Treat a bare date as "up to the end of that day"
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) to.setHours(23, 59, 59, 999);
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
  async settleOrder(
    order: any,
    actor: ParcelActor,
    options: { agency?: any } = {}
  ): Promise<ServiceResponse> {
    const existing = await ParcelSettlement.findOne({ order: order._id });
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

    const agency =
      options.agency ||
      (await Agency.findById(agencyId).select('agencyName profitPercentage type'));

    if (!agency) {
      return { success: false, message: 'Booking agency not found' };
    }

    // The split applies to the total the customer pays (transport + loading +
    // miscellaneous), and an "Own" agency earns no commission at all.
    const split = calculateProfitSplit(
      order.totalAmount || 0,
      effectiveCommissionPercentage(agency)
    );

    let agencyDebitTransactionId: string | undefined;
    let adminCreditTransactionId: string | undefined;
    let agencyBalanceAfter: number | undefined;

    if (split.walletDebitAmount > 0) {
      const debit = await debitWallet({
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

      const credit = await creditWallet({
        userId: ADMIN_WALLET_USER_ID,
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
        await creditWallet({
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
      status: 'settled' as const,
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
        ? await ParcelSettlement.findByIdAndUpdate(
            existing._id,
            {
              $set: { ...settlementData, adjustments: [] },
              $unset: {
                reversedAt: '',
                reversedBy: '',
                reversalReason: '',
                agencyRefundTransactionId: '',
                adminReversalTransactionId: '',
              },
            },
            { new: true }
          )
        : await ParcelSettlement.create(settlementData);
    } catch (error: any) {
      if (split.walletDebitAmount > 0) {
        await creditWallet({
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
        await debitWallet({
          userId: ADMIN_WALLET_USER_ID,
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
        message:
          error?.code === 11000
            ? `Parcel order ${order.orderNumber} is already settled`
            : error.message || 'Failed to record the settlement',
      };
    }

    await ParcelOrder.findByIdAndUpdate(order._id, {
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
  async adjustForChargeChange(
    order: any,
    previousAmount: number,
    newAmount: number,
    actor: ParcelActor,
    note?: string
  ): Promise<ServiceResponse> {
    const settlement = await ParcelSettlement.findOne({ order: order._id });

    if (!settlement || settlement.status !== 'settled') {
      return {
        success: true,
        message: 'No active settlement to adjust',
        data: { adjusted: false },
      };
    }

    const agencyId = settlement.agency.toString();
    const split = calculateProfitSplit(newAmount, settlement.profitPercentage);
    // Compare against what was actually taken from the wallet. Settlements
    // written before the wallet moved the full amount only debited the admin
    // share, so fall back to that for them.
    const previousDebit = round2(
      settlement.walletDebitAmount ?? settlement.adminShareAmount
    );
    const delta = round2(split.walletDebitAmount - previousDebit);

    let agencyTransactionId: string | undefined;
    let adminTransactionId: string | undefined;

    if (delta > 0) {
      // Charge went up -> the agency owes the admin more
      const debit = await debitWallet({
        userId: agencyId,
        amount: delta,
        type: 'debit',
        orderId: order.orderNumber,
        description: `Parcel order ${order.orderNumber} - additional booking amount (charge ₹${round2(
          previousAmount
        )} -> ₹${split.orderAmount})`,
        metadata: {
          source: 'parcel_settlement_adjustment',
          orderNumber: order.orderNumber,
          previousOrderAmount: round2(previousAmount),
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

      const credit = await creditWallet({
        userId: ADMIN_WALLET_USER_ID,
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
        await creditWallet({
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
    } else if (delta < 0) {
      // Charge went down -> refund the difference to the agency
      const amount = Math.abs(delta);

      const adminDebit = await debitWallet({
        userId: ADMIN_WALLET_USER_ID,
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

      const refund = await creditWallet({
        userId: agencyId,
        amount,
        type: 'refund',
        orderId: order.orderNumber,
        description: `Parcel order ${order.orderNumber} - booking amount refund (charge ₹${round2(
          previousAmount
        )} -> ₹${split.orderAmount})`,
        metadata: {
          source: 'parcel_settlement_adjustment',
          orderNumber: order.orderNumber,
          previousOrderAmount: round2(previousAmount),
          newOrderAmount: split.orderAmount,
          delta,
        },
      });

      if (!refund.success) {
        await creditWallet({
          userId: ADMIN_WALLET_USER_ID,
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
        previousOrderAmount: round2(previousAmount),
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

    await ParcelOrder.findByIdAndUpdate(order._id, {
      $set: {
        'walletSettlement.orderAmount': split.orderAmount,
        'walletSettlement.agencyProfitAmount': split.agencyProfitAmount,
        'walletSettlement.adminShareAmount': split.adminShareAmount,
        'walletSettlement.walletDebitAmount': split.walletDebitAmount,
      },
    });

    return {
      success: true,
      message:
        delta === 0
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
  async reverseSettlement(
    orderId: string,
    actor: ParcelActor,
    reason?: string
  ): Promise<ServiceResponse> {
    // Never query on a blank id — `{ order: undefined }` would silently match
    // the wrong document set instead of failing
    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return { success: false, message: 'Invalid order ID' };
    }

    const settlement = await ParcelSettlement.findOne({ order: orderId });

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
  async reverseSettlementById(
    settlementId: string,
    actor: ParcelActor,
    reason?: string
  ): Promise<ServiceResponse> {
    if (!Types.ObjectId.isValid(settlementId)) {
      return { success: false, message: 'Invalid settlement ID' };
    }

    const settlement = await ParcelSettlement.findById(settlementId);
    if (!settlement) {
      return { success: false, code: 404, message: 'Settlement not found' };
    }

    return this.applyReversal(settlement, actor, reason);
  }

  /** Shared reversal mechanics for both lookup paths */
  private async applyReversal(
    settlement: any,
    actor: ParcelActor,
    reason?: string
  ): Promise<ServiceResponse> {
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
    const amount = round2(settlement.walletDebitAmount ?? settlement.adminShareAmount);

    let agencyRefundTransactionId: string | undefined;
    let adminReversalTransactionId: string | undefined;

    if (amount > 0) {
      // Take it out of the admin wallet first; allowNegative keeps a reversal
      // from being blocked by a temporarily low settlement balance.
      const adminDebit = await debitWallet({
        userId: ADMIN_WALLET_USER_ID,
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

      const refund = await creditWallet({
        userId: agencyId,
        amount,
        type: 'refund',
        orderId: settlement.orderNumber,
        description: `Parcel order ${settlement.orderNumber} - booking amount refunded${
          reason ? ` (${reason})` : ''
        }`,
        metadata: {
          source: 'parcel_settlement_reversal',
          orderNumber: settlement.orderNumber,
          reason,
        },
      });

      if (!refund.success) {
        await creditWallet({
          userId: ADMIN_WALLET_USER_ID,
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
    await ParcelOrder.findByIdAndUpdate(settlement.order, {
      $set: { 'walletSettlement.status': 'reversed' },
    });

    return {
      success: true,
      message:
        amount > 0
          ? `₹${amount} refunded to the agency wallet`
          : 'Settlement reversed (no amount was moved)',
      data: { reversed: true, amount, settlement },
    };
  }

  /** Settle an order that has no settlement yet (or re-settle a reversed one) */
  async settleOrderById(orderId: string, actor: ParcelActor): Promise<ServiceResponse> {
    if (!Types.ObjectId.isValid(orderId)) {
      return { success: false, message: 'Invalid order ID' };
    }

    const order = await ParcelOrder.findById(orderId);
    if (!order) {
      return { success: false, code: 404, message: 'Parcel order not found' };
    }

    return this.settleOrder(order, actor);
  }

  async getAllSettlements(
    filters: SettlementListFilters,
    scope: { agencyId?: string } = {}
  ): Promise<ServiceResponse> {
    try {
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (scope.agencyId) {
        query.agency = scope.agencyId;
      } else if (filters.agency && Types.ObjectId.isValid(filters.agency)) {
        query.agency = filters.agency;
      }

      if (filters.status) query.status = filters.status;
      if (filters.orderNumber) {
        query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
      }

      const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
      if (range) query.settledAt = range;

      const [settlements, total, totals] = await Promise.all([
        ParcelSettlement.find(query)
          .populate(SETTLEMENT_POPULATE)
          .sort({ settledAt: -1 })
          .skip(skip)
          .limit(limit),
        ParcelSettlement.countDocuments(query),
        ParcelSettlement.aggregate([
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
            totalOrderAmount: round2(summary.totalOrderAmount),
            totalAgencyProfit: round2(summary.totalAgencyProfit),
            totalAdminShare: round2(summary.totalAdminShare),
          },
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching settlements',
      };
    }
  }

  async getSettlementById(
    id: string,
    scope: { agencyId?: string } = {}
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid settlement ID' };
      }

      const settlement = await ParcelSettlement.findById(id).populate(
        SETTLEMENT_POPULATE
      );
      if (!settlement) {
        return { success: false, code: 404, message: 'Settlement not found' };
      }

      const agencyRef: any = settlement.agency;
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
      ].filter(Boolean) as string[];

      const transactions = transactionIds.length
        ? await Transaction.find({ transactionId: { $in: transactionIds } })
            .sort({ createdAt: 1 })
            .lean()
        : [];

      return { success: true, data: { settlement, transactions } };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching settlement',
      };
    }
  }

  async updateSettlementNotes(id: string, notes: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid settlement ID' };
      }

      const settlement = await ParcelSettlement.findByIdAndUpdate(
        id,
        { $set: { notes } },
        { new: true }
      ).populate(SETTLEMENT_POPULATE);

      if (!settlement) {
        return { success: false, code: 404, message: 'Settlement not found' };
      }

      return {
        success: true,
        message: 'Settlement notes updated successfully',
        data: settlement,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating settlement notes',
      };
    }
  }

  /** Admin earnings, overall and per agency */
  async getSummary(filters: SettlementListFilters): Promise<ServiceResponse> {
    try {
      const match: any = { status: 'settled' };

      if (filters.agency && Types.ObjectId.isValid(filters.agency)) {
        match.agency = new Types.ObjectId(filters.agency);
      }

      const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
      if (range) match.settledAt = range;

      const [overall, perAgency] = await Promise.all([
        ParcelSettlement.aggregate([
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
        ParcelSettlement.aggregate([
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

      const reversed = await ParcelSettlement.aggregate([
        { $match: { ...match, status: 'reversed' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$adminShareAmount' } } },
      ]);

      return {
        success: true,
        data: {
          settledOrders: totals.orders,
          totalOrderAmount: round2(totals.totalOrderAmount),
          totalAgencyProfit: round2(totals.totalAgencyProfit),
          totalAdminShare: round2(totals.totalAdminShare),
          reversedOrders: reversed[0]?.count || 0,
          reversedAmount: round2(reversed[0]?.amount || 0),
          perAgency,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error building settlement summary',
      };
    }
  }
}

export const parcelSettlementService = new ParcelSettlementService();
