import { Router } from 'express';
import {
  getMyAgencyPayout,
  getMyAgencyPaymentHistory,
} from '../../controllers/admin/agencyPayout.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { agencyModule, agencyPermission } from '../../config/agencyModule';

/**
 * An agency's own payout details — base: /admin/agency/payout
 *
 * The same figures admin sees on /admin/agency-payout/{agencyId}, read-only and
 * scoped to the logged-in agency, so no agency id is accepted. Paying and
 * reversing stay on the admin routes: an agency reads what it has earned and
 * what has reached it, it does not record its own payments.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('agency'));
router.use(
  requireModulePermission({ agency: agencyPermission(agencyModule.payout_management) }, 'read')
);

/**
 * @swagger
 * /admin/agency/payout:
 *   get:
 *     summary: This agency's payout details and order history
 *     description: >
 *       The four cards at the top of the screen (Total Booking Amount, Profit,
 *       Paid, Remaining to Pay) plus the settled bookings behind them. `lrNo` on
 *       each row is the parcel order number. Commission is paid by bank
 *       transfer, so `paid` counts the payments admin has recorded — it is not a
 *       wallet balance.
 *     tags: [Agency Payout - Agency]
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
 *       403: { description: Agency access required }
 */
router.get('/', getMyAgencyPayout);

/**
 * @swagger
 * /admin/agency/payout/payments:
 *   get:
 *     summary: Commission payments this agency has received
 *     description: >
 *       Newest first. A reversed row is one admin entered by mistake and undone;
 *       it stays visible but stops counting towards `paid`.
 *     tags: [Agency Payout - Agency]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [paid, reversed] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: summary plus payments and pagination }
 *       403: { description: Agency access required }
 */
router.get('/payments', getMyAgencyPaymentHistory);

export default router;
