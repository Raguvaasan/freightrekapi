import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { hubModule, hubPermission } from '../../config/hubModule';
import { getHubDashboard } from '../../controllers/hub/dashboard.controller';
import { getHubParcelDashboard } from '../../controllers/admin/parcelDashboard.controller';

/**
 * A hub's dashboard — base: /hub/dashboard
 *
 * The root path is the parcel flow. The pre-parcel courier screen is unchanged,
 * just moved to /hub/dashboard/shipments.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('hub'));
// A direct hub login owns the module; hub staff need it on their HubRole
router.use(requireModulePermission({ hub: hubPermission(hubModule.dashboard) }, 'read'));

/**
 * @swagger
 * /hub/dashboard:
 *   get:
 *     summary: This hub's dashboard (parcel flow)
 *     description: >
 *       Only the parcels an admin has routed to this hub. pendingOrders are the
 *       ones assigned but not dispatched onward — the hub's own queue;
 *       inTransitOrders have left the hub and are not delivered yet. A hub never
 *       books, so there is no revenue here.
 *       todayOrders counts parcels booked today and routed here; todayAssigned
 *       counts the ones handed to this hub today, whenever they were booked.
 *     tags: [Dashboard - Hub]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: >
 *           hub { hubId, hubName, city, state, status } and overview
 *           { todayOrders, todayAssigned, assignedOrders, pendingOrders,
 *           inTransitOrders, deliveredOrders }
 *       403: { description: Hub access required }
 */
router.get('/', getHubParcelDashboard);

/**
 * @route   GET /hub/dashboard/shipments
 * @desc    Courier-shipment dashboard for this hub (the pre-parcel screen)
 * @query   period - 'week' | 'thisMonth' | 'lastMonth' | 'month' (default: 'thisMonth')
 * @access  Hub / hub staff
 */
router.get('/shipments', getHubDashboard);

export default router;
