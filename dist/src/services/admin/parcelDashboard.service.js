"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parcelDashboardService = exports.ParcelDashboardService = void 0;
const mongoose_1 = require("mongoose");
const parcelOrder_model_1 = require("../../models/admin/parcelOrder.model");
const parcelSettlement_model_1 = require("../../models/admin/parcelSettlement.model");
const agencyPayout_model_1 = require("../../models/admin/agencyPayout.model");
const agency_model_1 = require("../../models/admin/agency.model");
const hub_model_1 = require("../../models/hub/hub.model");
const walletLedger_1 = require("../../utils/walletLedger");
/**
 * Payment types the customer has not settled at booking time. A Prepaid ("Paid")
 * booking is collected up front; the other two are collected later, so they are
 * what an agency is still owed.
 */
const UNCOLLECTED_PAYMENT_TYPES = ['To Pay', 'Credit'];
/** Midnight today, the boundary every "today's ..." figure is measured from */
const startOfToday = () => {
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
class ParcelDashboardService {
    /** Order count and revenue for one set of orders, in a single pass */
    async countAndRevenue(match) {
        const rows = await parcelOrder_model_1.ParcelOrder.aggregate([
            { $match: match },
            { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        ]);
        const row = rows[0] || { orders: 0, revenue: 0 };
        return { orders: row.orders, revenue: (0, walletLedger_1.round2)(row.revenue) };
    }
    /**
     * An agency's own dashboard.
     *
     * "Orders" and revenue mean what this agency booked — parcels addressed to it
     * for delivery are counted separately as inward. Revenue is the total the
     * customer pays (transportation + loading + miscellaneous).
     */
    async getAgencyDashboard(agencyId) {
        try {
            if (!agencyId || !mongoose_1.Types.ObjectId.isValid(agencyId)) {
                return { success: false, message: 'Invalid agency ID' };
            }
            const agency = await agency_model_1.Agency.findById(agencyId).select('agencyName city state status profitPercentage');
            if (!agency) {
                return { success: false, code: 404, message: 'Agency not found' };
            }
            const id = new mongoose_1.Types.ObjectId(agencyId);
            const today = startOfToday();
            // Booked here vs addressed here — the two ends of this agency's traffic
            const booked = { agency: id };
            const inward = { 'deliveryCustomer.deliveryAgency': id };
            const [allTime, todayTotals, outstanding, payout, paidOut, deliveredOrders, inTransitOrders, inwardOrders, wallet,] = await Promise.all([
                this.countAndRevenue(booked),
                this.countAndRevenue({ ...booked, createdAt: { $gte: today } }),
                // Still to be collected from the customer: To Pay and Credit bookings
                // that have not been handed over yet. A delivered To Pay is taken as
                // collected on handover, and Prepaid was collected at booking.
                parcelOrder_model_1.ParcelOrder.aggregate([
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
                parcelSettlement_model_1.ParcelSettlement.aggregate([
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
                agencyPayout_model_1.AgencyPayout.aggregate([
                    { $match: { agency: id, status: 'paid' } },
                    { $group: { _id: null, payments: { $sum: 1 }, amount: { $sum: '$amount' } } },
                ]),
                parcelOrder_model_1.ParcelOrder.countDocuments({ ...booked, status: 'Delivered' }),
                parcelOrder_model_1.ParcelOrder.countDocuments({ ...booked, status: { $in: parcelOrder_model_1.IN_TRANSIT_STATUSES } }),
                // Inward drops a parcel as soon as it is delivered
                parcelOrder_model_1.ParcelOrder.countDocuments({
                    ...inward,
                    status: { $in: parcelOrder_model_1.INWARD_PENDING_STATUSES },
                }),
                (0, walletLedger_1.ensureWallet)(agencyId),
            ]);
            const outstandingRow = outstanding[0] || { orders: 0, amount: 0 };
            const payoutRow = payout[0] || { orders: 0, amount: 0 };
            const paidRow = paidOut[0] || { payments: 0, amount: 0 };
            const profitEarned = (0, walletLedger_1.round2)(payoutRow.amount);
            const profitPaid = (0, walletLedger_1.round2)(paidRow.amount);
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
                        totalOutstanding: (0, walletLedger_1.round2)(outstandingRow.amount),
                        outstandingOrders: outstandingRow.orders,
                        /**
                         * Commission still owed: earned across settled bookings, less what
                         * admin has already paid out. The two halves are reported too, so
                         * this screen and the admin payout screen can never disagree.
                         */
                        totalPayoutDue: (0, walletLedger_1.round2)(profitEarned - profitPaid),
                        totalProfitEarned: profitEarned,
                        totalPayoutPaid: profitPaid,
                        payoutOrders: payoutRow.orders,
                        deliveredOrders,
                        inTransitOrders,
                        /** Addressed here for delivery and not handed over yet */
                        inwardOrders,
                        walletBalance: (0, walletLedger_1.round2)(wallet.balance),
                        currency: 'INR',
                    },
                },
            };
        }
        catch (error) {
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
    async getHubDashboard(hubId) {
        try {
            if (!hubId || !mongoose_1.Types.ObjectId.isValid(hubId)) {
                return { success: false, message: 'Invalid hub ID' };
            }
            const hub = await hub_model_1.HubModel.findById(hubId).select('hubName city state status');
            if (!hub) {
                return { success: false, code: 404, message: 'Hub not found' };
            }
            const id = new mongoose_1.Types.ObjectId(hubId);
            const today = startOfToday();
            const routedHere = { hub: id };
            const [todayOrders, todayAssigned, assignedOrders, pendingOrders, inTransitOrders, deliveredOrders,] = await Promise.all([
                // Booked today and routed here. `todayAssigned` is the other reading —
                // handed to this hub today, whenever it was booked.
                parcelOrder_model_1.ParcelOrder.countDocuments({ ...routedHere, createdAt: { $gte: today } }),
                parcelOrder_model_1.ParcelOrder.countDocuments({ ...routedHere, hubAssignedAt: { $gte: today } }),
                parcelOrder_model_1.ParcelOrder.countDocuments(routedHere),
                // Still on this hub's hands: assigned but not dispatched onward
                parcelOrder_model_1.ParcelOrder.countDocuments({
                    ...routedHere,
                    status: { $in: parcelOrder_model_1.HUB_PENDING_STATUSES },
                }),
                // Left the hub, not yet delivered
                parcelOrder_model_1.ParcelOrder.countDocuments({
                    ...routedHere,
                    status: { $in: parcelOrder_model_1.HUB_IN_TRANSIT_STATUSES },
                }),
                parcelOrder_model_1.ParcelOrder.countDocuments({ ...routedHere, status: 'Delivered' }),
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
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching the hub dashboard',
            };
        }
    }
}
exports.ParcelDashboardService = ParcelDashboardService;
exports.parcelDashboardService = new ParcelDashboardService();
