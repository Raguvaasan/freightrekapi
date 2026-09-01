"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parcelDashboard_controller_1 = require("../../controllers/admin/parcelDashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const agencyModule_1 = require("../../config/agencyModule");
/**
 * An agency's own dashboard — base: /admin/agency/dashboard
 *
 * Scoped to the logged-in agency, so no agency id is accepted. An admin
 * comparing agencies uses /admin/dashboard instead.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('agency'));
router.use((0, parcelActor_middleware_1.requireModulePermission)({ agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.dashboard) }, 'read'));
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
router.get('/', parcelDashboard_controller_1.getAgencyDashboard);
exports.default = router;
