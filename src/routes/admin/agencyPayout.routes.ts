import { Router } from 'express';
import {
  getAllAgencyPayouts,
  getAgencyPayout,
  recordAgencyPayment,
  getAgencyPaymentHistory,
  reverseAgencyPayment,
} from '../../controllers/admin/agencyPayout.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireParcelRole, requireAdminPermission } from '../../middleware/parcelActor.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  agencyPayoutByAgencySchema,
  recordAgencyPaymentSchema,
  reverseAgencyPaymentSchema,
} from '../../validators/admin/agencyPayout.validator';
import { adminModule } from '../../config/adminModule';

/**
 * Agency Payout Details — base: /admin/agency-payout
 *
 * What admin owes each agency in commission, and what has been paid. Admin
 * only: an agency sees its own figures on its dashboard instead.
 *
 * A payout is a record of a bank transfer, not a wallet movement — see
 * AgencyPayoutService for why the agency wallet is deliberately left alone.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('admin'));

/**
 * @swagger
 * /admin/agency-payout:
 *   get:
 *     summary: Every agency with what it has earned and what is still owed
 *     tags: [Agency Payout]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches agency name, owner, phone or city
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200:
 *         description: >
 *           agencies[] each with totalBookingAmount, profit, paid,
 *           remainingToPay — plus company-wide totals and pagination
 */
router.get(
  '/',
  requireAdminPermission(adminModule.wallet_management, 'read'),
  getAllAgencyPayouts
);

/**
 * @swagger
 * /admin/agency-payout/{agencyId}:
 *   get:
 *     summary: One agency's payout details and order history
 *     description: >
 *       The four cards at the top of the screen (Total Booking Amount, Profit,
 *       Paid, Remaining to Pay) plus the settled bookings behind them. `lrNo`
 *       on each row is the parcel order number.
 *     tags: [Agency Payout]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filters the order history by LR number
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: >
 *           agency, summary { totalBookingAmount, profit, paid, remainingToPay },
 *           orders[] { serialNo, date, lrNo, bookingAmount, profit }, pagination
 *       404: { description: Agency not found }
 */
router.get(
  '/:agencyId',
  requireAdminPermission(adminModule.wallet_management, 'read'),
  validate(agencyPayoutByAgencySchema),
  getAgencyPayout
);

/**
 * @swagger
 * /admin/agency-payout/{agencyId}/pay:
 *   post:
 *     summary: Record a commission payment to an agency (the "Pay" button)
 *     description: >
 *       Records that the amount was paid to the agency, so it counts towards
 *       `paid` and comes off `remainingToPay`. No wallet moves — the agency
 *       wallet is a prepaid float for booking and commission is settled by bank
 *       transfer. Paying more than is outstanding is refused with 400.
 *     tags: [Agency Payout]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, example: 500 }
 *               paymentMethod: { type: string, example: bank_transfer }
 *               reference: { type: string, example: NEFT-99120 }
 *               remarks: { type: string, example: August commission }
 *     responses:
 *       201:
 *         description: Payment recorded; returns the payout and the refreshed summary
 *       400:
 *         description: Amount exceeds what is outstanding, or nothing is owed
 */
router.post(
  '/:agencyId/pay',
  requireAdminPermission(adminModule.wallet_management, 'write'),
  validate(recordAgencyPaymentSchema),
  recordAgencyPayment
);

/**
 * @swagger
 * /admin/agency-payout/{agencyId}/payments:
 *   get:
 *     summary: Payments already made to this agency
 *     tags: [Agency Payout]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [paid, reversed] }
 *     responses:
 *       200: { description: "summary plus payments and pagination" }
 */
router.get(
  '/:agencyId/payments',
  requireAdminPermission(adminModule.wallet_management, 'read'),
  validate(agencyPayoutByAgencySchema),
  getAgencyPaymentHistory
);

/**
 * @swagger
 * /admin/agency-payout/payments/{paymentId}:
 *   delete:
 *     summary: Reverse a payment recorded by mistake
 *     description: >
 *       The row is kept and marked reversed rather than deleted, so the history
 *       still shows it happened; the amount stops counting towards `paid`.
 *     tags: [Agency Payout]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Paid to the wrong agency" }
 *     responses:
 *       200: { description: Payment reversed; returns the refreshed summary }
 *       409: { description: Already reversed }
 */
router.delete(
  '/payments/:paymentId',
  requireAdminPermission(adminModule.wallet_management, 'delete'),
  validate(reverseAgencyPaymentSchema),
  reverseAgencyPayment
);

export default router;
