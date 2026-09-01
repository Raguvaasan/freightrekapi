import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import {
  getAdminDashboard,
  getTopAgencies,
  getShipmentDashboard,
  getTopFranchises,
  getWalletStatistics,
  getOrdersStatistics,
  getFranchiseReport
} from '../../controllers/admin/dashboard.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard (parcel flow)
 *     description: >
 *       Agency and hub counts, all-time and today's orders and revenue, the
 *       Prepaid / ToPay / Credit split, recent bookings, top agencies and the
 *       settlement money summary. Revenue is the total the customer pays
 *       (transportation + loading + miscellaneous) on parcel bookings. The
 *       courier-shipment screen is at /admin/dashboard/shipments.
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [today, week, month, year, all], default: all }
 *         description: >
 *           Scopes the payment-type chart and the top-agency table. The headline
 *           totals are always all-time, next to today's figures.
 *     responses:
 *       200:
 *         description: >
 *           overview { totalAgencies, totalHubs, totalOrders, totalRevenue,
 *           todayOrders, todayRevenue }, paymentTypeDistribution[],
 *           recentBookings[], topAgencies[], walletSummary
 */
router.get('/', getAdminDashboard);

/**
 * @swagger
 * /admin/dashboard/top-agencies:
 *   get:
 *     summary: Top agencies by parcel bookings
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [today, week, month, year, all], default: all }
 *     responses:
 *       200:
 *         description: "agencies[] with agencyId, agencyName, city, orders, revenue"
 */
router.get('/top-agencies', getTopAgencies);

/**
 * @swagger
 * /admin/dashboard/wallet-statistics:
 *   get:
 *     summary: Wallet and settlement money summary
 *     description: >
 *       Total wallet movements, plus how every booking total was split -
 *       paymentForTruecargo is the admin's share remitted out of the agency
 *       wallets, agencyPayment is the commission the agencies kept. Settled
 *       bookings only; a reversed settlement has been undone in the wallets.
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: >
 *           totalTransactions, paymentForTruecargo, agencyPayment, settledOrders,
 *           totalBookingAmount, totalBalance, totalWallets, credits, debits
 */
router.get('/wallet-statistics', getWalletStatistics);

/**
 * @route   GET /admin/dashboard/shipments
 * @desc    Courier-shipment dashboard (the pre-parcel screen)
 * @query   period - 'day' | 'week' | 'month' | 'year' (default: 'week')
 * @access  Admin only
 */
router.get('/shipments', getShipmentDashboard);

/**
 * @route   GET /admin/dashboard/top-franchises
 * @desc    Top performing franchises by courier shipments (legacy; use /top-agencies)
 * @query   limit - number of franchises to return (default: 5)
 * @access  Admin only
 */
router.get('/top-franchises', getTopFranchises);

/**
 * @route   GET /admin/dashboard/orders-statistics
 * @desc    Get orders statistics - total count and per day breakdown
 * @access  Admin only
 */
router.get('/orders-statistics', getOrdersStatistics);

/**
 * @route   GET /admin/dashboard/franchise-report
 * @desc    Get franchise-wise performance data for reports
 * @query   period - 'day' | 'week' | 'month' | 'year' (default: 'month')
 * @access  Admin only
 */
router.get('/franchise-report', getFranchiseReport);

export default router;
