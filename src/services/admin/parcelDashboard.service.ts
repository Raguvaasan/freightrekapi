import { Types } from 'mongoose';
import {
  ParcelOrder,
  IN_TRANSIT_STATUSES,
  HUB_PENDING_STATUSES,
  HUB_IN_TRANSIT_STATUSES,
  INWARD_PENDING_STATUSES,
} from '../../models/admin/parcelOrder.model';
import { ParcelSettlement } from '../../models/admin/parcelSettlement.model';
import { AgencyPayout } from '../../models/admin/agencyPayout.model';
import { Agency } from '../../models/admin/agency.model';
import { HubModel } from '../../models/hub/hub.model';
import { ensureWallet, round2 } from '../../utils/walletLedger';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  code?: number;
}

/**
 * Payment types the customer has not settled at booking time. A Prepaid ("Paid")
 * booking is collected up front; the other two are collected later, so they are
 * what an agency is still owed.
 */
const UNCOLLECTED_PAYMENT_TYPES = ['To Pay', 'Credit'];

/** Midnight today, the boundary every "today's ..." figure is measured from */
const startOfToday = (): Date => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Dashboards for the two parties working a parcel: the agency that books and
 * delivers it, and the hub that routes it.
 *
 * Every figure comes from ParcelOrder and ParcelSettlement — the same records
 * the listings and the wallet read — so a tile and the list behind it can never
 * disagree.
 */
export class ParcelDashboardService {
  /** Order count and revenue for one set of orders, in a single pass */
  private async countAndRevenue(match: any): Promise<{ orders: number; revenue: number }> {
    const rows = await ParcelOrder.aggregate([
      { $match: match },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]);
    const row = rows[0] || { orders: 0, revenue: 0 };
    return { orders: row.orders, revenue: round2(row.revenue) };
  }

  /**
   * An agency's own dashboard.
   *
   * "Orders" and revenue mean what this agency booked — parcels addressed to it
   * for delivery are counted separately as inward. Revenue is the total the
   * customer pays (transportation + loading + miscellaneous).
   */
  async getAgencyDashboard(agencyId?: string): Promise<ServiceResponse> {
    try {
      if (!agencyId || !Types.ObjectId.isValid(agencyId)) {
        return { success: false, message: 'Invalid agency ID' };
      }

      const agency = await Agency.findById(agencyId).select(
        'agencyName city state status profitPercentage'
      );
      if (!agency) {
        return { success: false, code: 404, message: 'Agency not found' };
      }

      const id = new Types.ObjectId(agencyId);
      const today = startOfToday();

      // Booked here vs addressed here — the two ends of this agency's traffic
      const booked = { agency: id };
      const inward = { 'deliveryCustomer.deliveryAgency': id };

      const [
        allTime,
        todayTotals,
        outstanding,
        payout,
        paidOut,
        deliveredOrders,
        inTransitOrders,
        inwardOrders,
        wallet,
      ] = await Promise.all([
        this.countAndRevenue(booked),
        this.countAndRevenue({ ...booked, createdAt: { $gte: today } }),

        // Still to be collected from the customer: To Pay and Credit bookings
        // that have not been handed over yet. A delivered To Pay is taken as
        // collected on handover, and Prepaid was collected at booking.
        ParcelOrder.aggregate([
          {
            $match: {
              ...booked,
              paymentType: { $in: UNCOLLECTED_PAYMENT_TYPES },
              status: { $ne: 'Delivered' },
            },
          },
          { $group: { _id: null, orders: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
        ]),

        // Commission this agency has earned on its bookings — its share of every
        // settled booking, the rest having gone to the admin settlement wallet
        ParcelSettlement.aggregate([
          { $match: { agency: id, status: 'settled' } },
          {
            $group: {
              _id: null,
              orders: { $sum: 1 },
              amount: { $sum: '$agencyProfitAmount' },
            },
          },
        ]),

        // Commission already paid across to this agency (admin payout screen)
        AgencyPayout.aggregate([
          { $match: { agency: id, status: 'paid' } },
          { $group: { _id: null, payments: { $sum: 1 }, amount: { $sum: '$amount' } } },
        ]),

        ParcelOrder.countDocuments({ ...booked, status: 'Delivered' }),
        ParcelOrder.countDocuments({ ...booked, status: { $in: IN_TRANSIT_STATUSES } }),

        // Inward drops a parcel as soon as it is delivered
        ParcelOrder.countDocuments({
          ...inward,
          status: { $in: INWARD_PENDING_STATUSES },
        }),

        ensureWallet(agencyId),
      ]);

      const outstandingRow = outstanding[0] || { orders: 0, amount: 0 };
      const payoutRow = payout[0] || { orders: 0, amount: 0 };
      const paidRow = paidOut[0] || { payments: 0, amount: 0 };
      const profitEarned = round2(payoutRow.amount);
      const profitPaid = round2(paidRow.amount);

      return {
        success: true,
        data: {
          agency: {
            agencyId,
            agencyName: agency.agencyName,
            city: agency.city,
            state: agency.state,
            status: agency.status,
            profitPercentage: agency.profitPercentage ?? 0,
          },
          overview: {
            totalOrders: allTime.orders,
            todayOrders: todayTotals.orders,
            totalRevenue: allTime.revenue,
            todayRevenue: todayTotals.revenue,
            /** To Pay + Credit bookings not handed over yet */
            totalOutstanding: round2(outstandingRow.amount),
            outstandingOrders: outstandingRow.orders,
            /**
             * Commission still owed: earned across settled bookings, less what
             * admin has already paid out. The two halves are reported too, so
             * this screen and the admin payout screen can never disagree.
             */
            totalPayoutDue: round2(profitEarned - profitPaid),
            totalProfitEarned: profitEarned,
            totalPayoutPaid: profitPaid,
            payoutOrders: payoutRow.orders,
            deliveredOrders,
            inTransitOrders,
            /** Addressed here for delivery and not handed over yet */
            inwardOrders,
            walletBalance: round2(wallet.balance),
            currency: 'INR',
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching the agency dashboard',
      };
    }
  }

  /**
   * A hub's own dashboard.
   *
   * A hub never books, so there is no revenue here — only the parcels an admin
   * has routed to it and where each one has got to.
   */
  async getHubDashboard(hubId?: string): Promise<ServiceResponse> {
    try {
      if (!hubId || !Types.ObjectId.isValid(hubId)) {
        return { success: false, message: 'Invalid hub ID' };
      }

      const hub = await HubModel.findById(hubId).select('hubName city state status');
      if (!hub) {
        return { success: false, code: 404, message: 'Hub not found' };
      }

      const id = new Types.ObjectId(hubId);
      const today = startOfToday();
      const routedHere = { hub: id };

      const [
        todayOrders,
        todayAssigned,
        assignedOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
      ] = await Promise.all([
        // Booked today and routed here. `todayAssigned` is the other reading —
        // handed to this hub today, whenever it was booked.
        ParcelOrder.countDocuments({ ...routedHere, createdAt: { $gte: today } }),
        ParcelOrder.countDocuments({ ...routedHere, hubAssignedAt: { $gte: today } }),

        ParcelOrder.countDocuments(routedHere),

        // Still on this hub's hands: assigned but not dispatched onward
        ParcelOrder.countDocuments({
          ...routedHere,
          status: { $in: HUB_PENDING_STATUSES },
        }),

        // Left the hub, not yet delivered
        ParcelOrder.countDocuments({
          ...routedHere,
          status: { $in: HUB_IN_TRANSIT_STATUSES },
        }),

        ParcelOrder.countDocuments({ ...routedHere, status: 'Delivered' }),
      ]);

      return {
        success: true,
        data: {
          hub: {
            hubId,
            hubName: hub.hubName,
            city: hub.city,
            state: hub.state,
            status: hub.status,
          },
          overview: {
            todayOrders,
            todayAssigned,
            assignedOrders,
            pendingOrders,
            inTransitOrders,
            deliveredOrders,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching the hub dashboard',
      };
    }
  }
}

export const parcelDashboardService = new ParcelDashboardService();
