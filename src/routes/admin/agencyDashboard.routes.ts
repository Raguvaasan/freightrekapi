import { Router } from 'express';
import { getAgencyDashboard } from '../../controllers/admin/parcelDashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { agencyModule, agencyPermission } from '../../config/agencyModule';

/**
 * An agency's own dashboard — base: /admin/agency/dashboard
 *
 * Scoped to the logged-in agency, so no agency id is accepted. An admin
 * comparing agencies uses /admin/dashboard instead.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('agency'));
router.use(requireModulePermission({ agency: agencyPermission(agencyModule.dashboard) }, 'read'));

/**
 * @swagger
 * /admin/agency/dashboard:
 *   get:
 *     summary: This agency's dashboard
 *     description: >
 *       Orders and revenue mean what this agency booked; parcels addressed to it
 *       for delivery are counted separately as inwardOrders, and drop off that
 *       count once delivered. Revenue is the total the customer pays
 *       (transportation + loading + miscellaneous).
 *       totalOutstanding is the To Pay and Credit bookings not handed over yet;
 *       totalPayoutDue is the commission earned across settled bookings.
 *     tags: [Dashboard - Agency]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: >
 *           agency { agencyId, agencyName, city, state, status, profitPercentage }
 *           and overview { totalOrders, todayOrders, totalRevenue, todayRevenue,
 *           totalOutstanding, totalPayoutDue, deliveredOrders, inTransitOrders,
 *           inwardOrders, walletBalance }
 *       403: { description: Agency access required }
 */
router.get('/', getAgencyDashboard);

export default router;
