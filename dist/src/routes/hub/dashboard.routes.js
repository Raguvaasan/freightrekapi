"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const hubModule_1 = require("../../config/hubModule");
const dashboard_controller_1 = require("../../controllers/hub/dashboard.controller");
const parcelDashboard_controller_1 = require("../../controllers/admin/parcelDashboard.controller");
/**
 * A hub's dashboard — base: /hub/dashboard
 *
 * The root path is the parcel flow. The pre-parcel courier screen is unchanged,
 * just moved to /hub/dashboard/shipments.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('hub'));
// A direct hub login owns the module; hub staff need it on their HubRole
router.use((0, parcelActor_middleware_1.requireModulePermission)({ hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.dashboard) }, 'read'));
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
router.get('/', parcelDashboard_controller_1.getHubParcelDashboard);
/**
 * @route   GET /hub/dashboard/shipments
 * @desc    Courier-shipment dashboard for this hub (the pre-parcel screen)
 * @query   period - 'week' | 'thisMonth' | 'lastMonth' | 'month' (default: 'thisMonth')
 * @access  Hub / hub staff
 */
router.get('/shipments', dashboard_controller_1.getHubDashboard);
exports.default = router;
