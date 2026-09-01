"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parcelDashboard_controller_1 = require("../../controllers/admin/parcelDashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const hubModule_1 = require("../../config/hubModule");
/**
 * A hub's own dashboard — base: /admin/hub/dashboard
 *
 * The same screen as GET /hub/dashboard, mounted here as well so the two
 * self-service dashboards sit at matching paths (/admin/agency/dashboard and
 * /admin/hub/dashboard). Mounted before the admin `/admin/hub/:id` routes so
 * "dashboard" is not read as a hub id.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('hub'));
// A direct hub login owns the module; hub staff need it on their HubRole
router.use((0, parcelActor_middleware_1.requireModulePermission)({ hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.dashboard) }, 'read'));
/**
 * @swagger
 * /admin/hub/dashboard:
 *   get:
 *     summary: This hub's dashboard (parcel flow)
 *     description: >
 *       Identical to GET /hub/dashboard. Only the parcels an admin has routed
 *       to this hub. pendingOrders are assigned but not dispatched onward —
 *       the hub's own queue; inTransitOrders have left the hub and are not
 *       delivered yet. A hub never books, so there is no revenue here.
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
exports.default = router;
