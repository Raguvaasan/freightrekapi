import { Types } from 'mongoose';
import { Agency } from '../../models/admin/agency.model';
import { AgencyPayout } from '../../models/admin/agencyPayout.model';
import { ParcelSettlement } from '../../models/admin/parcelSettlement.model';
import { ParcelActor } from '../../utils/parcelActor';
import { round2 } from '../../utils/walletLedger';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  code?: number;
}

interface PayoutListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface RecordPaymentInput {
  amount: number;
  paymentMethod?: string;
  reference?: string;
  remarks?: string;
}

const AGENCY_SELECT =
  'agencyName agencyOwner phone email city state status type profitPercentage';

/**
 * What admin owes each agency in commission, and what has been paid.
 *
 * An agency keeps a share of every booking it makes. That share is recorded on
 * the settlement (agencyProfitAmount) but never moves through a wallet — the
 * agency wallet is a prepaid float for booking, so mixing commission into it
 * would make the balance mean two things. Commission is paid by bank transfer
 * and the payment is recorded here:
 *
 *   profit    = sum(agencyProfitAmount) over settled bookings
 *   paid      = sum(amount) over payouts that have not been reversed
 *   remaining = profit - paid
 */
export class AgencyPayoutService {
  private buildDateRange(dateFrom?: string, dateTo?: string) {
    const range: any = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) range.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
    }
    return Object.keys(range).length ? range : null;
  }

  /** Booking totals and commission earned, per agency id */
  private async earnedByAgency(agencyIds: Types.ObjectId[]) {
    const rows = await ParcelSettlement.aggregate([
      { $match: { status: 'settled', agency: { $in: agencyIds } } },
      {
        $group: {
          _id: '$agency',
          orders: { $sum: 1 },
          bookingAmount: { $sum: '$orderAmount' },
          profit: { $sum: '$agencyProfitAmount' },
        },
      },
    ]);
    return new Map(rows.map((r: any) => [r._id.toString(), r]));
  }

  /** Commission already paid out, per agency id (reversed payouts excluded) */
  private async paidByAgency(agencyIds: Types.ObjectId[]) {
    const rows = await AgencyPayout.aggregate([
      { $match: { status: 'paid', agency: { $in: agencyIds } } },
      { $group: { _id: '$agency', payments: { $sum: 1 }, paid: { $sum: '$amount' } } },
    ]);
    return new Map(rows.map((r: any) => [r._id.toString(), r]));
  }

  /** The four figures the payout screen leads with */
  private totalsFrom(earned: any, paid: any) {
    const totalBookingAmount = round2(earned?.bookingAmount || 0);
    const profit = round2(earned?.profit || 0);
    const paidAmount = round2(paid?.paid || 0);

    return {
      totalBookingAmount,
      profit,
      paid: paidAmount,
      remainingToPay: round2(profit - paidAmount),
      settledOrders: earned?.orders || 0,
      payments: paid?.payments || 0,
      currency: 'INR',
    };
  }

  /** Every agency with what it has earned and what is still owed */
  async getAllAgencyPayouts(filters: PayoutListFilters): Promise<ServiceResponse> {
    try {
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (filters.search) {
        query.$or = [
          { agencyName: { $regex: filters.search, $options: 'i' } },
          { agencyOwner: { $regex: filters.search, $options: 'i' } },
          { phone: { $regex: filters.search, $options: 'i' } },
          { city: { $regex: filters.search, $options: 'i' } },
        ];
      }
      if (filters.status) query.status = filters.status;

      const [agencies, total] = await Promise.all([
        Agency.find(query)
          .select(AGENCY_SELECT)
          .sort({ agencyName: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Agency.countDocuments(query),
      ]);

      const ids = agencies.map((a) => a._id as Types.ObjectId);
      const [earned, paid] = await Promise.all([
        this.earnedByAgency(ids),
        this.paidByAgency(ids),
      ]);

      const rows = agencies.map((agency) => {
        const id = agency._id.toString();
        return {
          agencyId: id,
          agencyName: agency.agencyName,
          agencyOwner: agency.agencyOwner,
          phone: agency.phone,
          city: agency.city,
          status: agency.status,
          type: agency.type,
          agencyType: agency.type === 'Own',
          profitPercentage: agency.profitPercentage ?? 0,
          ...this.totalsFrom(earned.get(id), paid.get(id)),
        };
      });

      // Company-wide, across every agency rather than just this page
      const allIds = (await Agency.find({}, '_id').lean()).map(
        (a) => a._id as Types.ObjectId
      );
      const [allEarned, allPaid] = await Promise.all([
        this.earnedByAgency(allIds),
        this.paidByAgency(allIds),
      ]);
      const sum = (map: Map<string, any>, key: string) =>
        round2([...map.values()].reduce((t, r: any) => t + (r[key] || 0), 0));

      const profitAll = sum(allEarned, 'profit');
      const paidAll = sum(allPaid, 'paid');

      return {
        success: true,
        data: {
          agencies: rows,
          totals: {
            totalBookingAmount: sum(allEarned, 'bookingAmount'),
            profit: profitAll,
            paid: paidAll,
            remainingToPay: round2(profitAll - paidAll),
            currency: 'INR',
          },
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error fetching agency payouts' };
    }
  }

  private async resolveAgency(agencyId: string) {
    if (!agencyId || !Types.ObjectId.isValid(agencyId)) {
      return { error: { success: false, message: 'Invalid agency ID' } as ServiceResponse };
    }
    const agency = await Agency.findById(agencyId).select(AGENCY_SELECT).lean();
    if (!agency) {
      return {
        error: { success: false, code: 404, message: 'Agency not found' } as ServiceResponse,
      };
    }
    return { agency };
  }

  /** The four totals for one agency, without the order history */
  private async summaryFor(agencyId: string) {
    const id = new Types.ObjectId(agencyId);
    const [earned, paid] = await Promise.all([
      this.earnedByAgency([id]),
      this.paidByAgency([id]),
    ]);
    return this.totalsFrom(earned.get(agencyId), paid.get(agencyId));
  }

  /**
   * One agency's payout page: the four totals plus the order history behind
   * them, newest first. "LR NO" on the screen is the parcel order number.
   */
  async getAgencyPayout(
    agencyId: string,
    filters: PayoutListFilters = {}
  ): Promise<ServiceResponse> {
    try {
      const resolved = await this.resolveAgency(agencyId);
      if (resolved.error) return resolved.error;
      const agency = resolved.agency!;

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const skip = (page - 1) * limit;

      const match: any = { agency: new Types.ObjectId(agencyId), status: 'settled' };
      const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
      if (range) match.settledAt = range;
      if (filters.search) {
        match.orderNumber = { $regex: filters.search, $options: 'i' };
      }

      const [orders, orderCount, summary] = await Promise.all([
        ParcelSettlement.find(match)
          .select(
            'orderNumber order orderAmount agencyProfitAmount adminShareAmount profitPercentage settledAt'
          )
          .sort({ settledAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ParcelSettlement.countDocuments(match),
        this.summaryFor(agencyId),
      ]);

      return {
        success: true,
        data: {
          agency: {
            agencyId,
            agencyName: agency.agencyName,
            agencyOwner: agency.agencyOwner,
            phone: agency.phone,
            email: agency.email,
            city: agency.city,
            state: agency.state,
            status: agency.status,
            type: agency.type,
            agencyType: agency.type === 'Own',
            profitPercentage: agency.profitPercentage ?? 0,
          },
          // The four cards at the top of the screen
          summary,
          // "Order History" — one row per settled booking
          orders: orders.map((row: any, index: number) => ({
            serialNo: skip + index + 1,
            orderId: row.order,
            date: row.settledAt,
            lrNo: row.orderNumber,
            bookingAmount: round2(row.orderAmount || 0),
            profit: round2(row.agencyProfitAmount || 0),
            profitPercentage: row.profitPercentage ?? 0,
            adminShare: round2(row.adminShareAmount || 0),
          })),
          pagination: {
            total: orderCount,
            page,
            limit,
            totalPages: Math.ceil(orderCount / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error fetching the agency payout' };
    }
  }

  /**
   * Record a commission payment to an agency.
   *
   * Paying more than is owed is refused rather than left to run the balance
   * negative — an overpayment is almost always a typo, and a negative
   * "remaining to pay" is not something the screen can explain.
   */
  async recordPayment(
    agencyId: string,
    data: RecordPaymentInput,
    actor: ParcelActor
  ): Promise<ServiceResponse> {
    try {
      const resolved = await this.resolveAgency(agencyId);
      if (resolved.error) return resolved.error;
      const agency = resolved.agency!;

      const amount = round2(Number(data.amount));
      if (!amount || isNaN(amount) || amount <= 0) {
        return { success: false, message: 'Amount must be greater than 0' };
      }

      const summary = await this.summaryFor(agencyId);

      if (summary.remainingToPay <= 0) {
        return {
          success: false,
          message: `"${agency.agencyName}" has nothing outstanding - ${summary.profit} earned and ${summary.paid} already paid`,
          data: summary,
        };
      }

      if (amount > summary.remainingToPay) {
        return {
          success: false,
          message: `${amount} is more than the ${summary.remainingToPay} outstanding for "${agency.agencyName}"`,
          data: summary,
        };
      }

      const payout = await AgencyPayout.create({
        agency: agency._id,
        amount,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        remarks: data.remarks,
        status: 'paid',
        profitAtPayment: summary.profit,
        paidBeforeThis: summary.paid,
        paidAt: new Date(),
        paidBy: actor.id,
        paidByName: actor.name,
      });

      return {
        success: true,
        message: `${amount} paid to "${agency.agencyName}"`,
        data: {
          payout,
          summary: await this.summaryFor(agencyId),
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error recording the payment' };
    }
  }

  /** Payments made to one agency, newest first */
  async getPaymentHistory(
    agencyId: string,
    filters: PayoutListFilters = {}
  ): Promise<ServiceResponse> {
    try {
      const resolved = await this.resolveAgency(agencyId);
      if (resolved.error) return resolved.error;

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
      const skip = (page - 1) * limit;

      const query: any = { agency: new Types.ObjectId(agencyId) };
      if (filters.status) query.status = filters.status;
      const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
      if (range) query.paidAt = range;

      const [payments, total, summary] = await Promise.all([
        AgencyPayout.find(query).sort({ paidAt: -1 }).skip(skip).limit(limit).lean(),
        AgencyPayout.countDocuments(query),
        this.summaryFor(agencyId),
      ]);

      return {
        success: true,
        data: {
          agencyId,
          agencyName: resolved.agency!.agencyName,
          summary,
          payments: payments.map((p: any, index: number) => ({
            serialNo: skip + index + 1,
            paymentId: p._id,
            date: p.paidAt,
            amount: round2(p.amount),
            paymentMethod: p.paymentMethod,
            reference: p.reference,
            remarks: p.remarks,
            status: p.status,
            paidByName: p.paidByName,
            reversedAt: p.reversedAt,
            reversalReason: p.reversalReason,
          })),
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching the payment history',
      };
    }
  }

  /**
   * Undo a payment recorded by mistake.
   *
   * The row is kept and marked reversed rather than deleted, so the history
   * still shows that it happened; the amount stops counting towards `paid`.
   */
  async reversePayment(
    paymentId: string,
    actor: ParcelActor,
    reason?: string
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(paymentId)) {
        return { success: false, message: 'Invalid payment ID' };
      }

      const payout = await AgencyPayout.findById(paymentId);
      if (!payout) {
        return { success: false, code: 404, message: 'Payment not found' };
      }
      if (payout.status === 'reversed') {
        return { success: false, code: 409, message: 'This payment is already reversed' };
      }

      payout.status = 'reversed';
      payout.reversedAt = new Date();
      payout.reversedBy = actor.id;
      payout.reversalReason = reason;
      await payout.save();

      return {
        success: true,
        message: `${round2(payout.amount)} payment reversed`,
        data: {
          payment: payout,
          summary: await this.summaryFor(payout.agency.toString()),
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error reversing the payment' };
    }
  }
}

export const agencyPayoutService = new AgencyPayoutService();
