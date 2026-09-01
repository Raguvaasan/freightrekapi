"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const unifiedAuth_routes_1 = __importDefault(require("./unifiedAuth.routes"));
const role_routes_1 = __importDefault(require("./role.routes"));
const hub_routes_1 = __importDefault(require("./hub.routes"));
const route_routes_1 = __importDefault(require("./route.routes"));
const vehicle_routes_1 = __importDefault(require("./vehicle.routes"));
const driver_routes_1 = __importDefault(require("./driver.routes"));
const parcelOrder_routes_1 = __importDefault(require("./parcelOrder.routes"));
const branchParcelOrder_routes_1 = __importDefault(require("./branchParcelOrder.routes"));
const branchWallet_routes_1 = __importDefault(require("./branchWallet.routes"));
const agencyPayout_routes_1 = __importDefault(require("./agencyPayout.routes"));
const agencyPayoutSelf_routes_1 = __importDefault(require("./agencyPayoutSelf.routes"));
const branchWalletSelf_routes_1 = __importDefault(require("./branchWalletSelf.routes"));
const parcelSettlement_routes_1 = __importDefault(require("./parcelSettlement.routes"));
const invoice_routes_1 = __importDefault(require("./invoice.routes"));
const agencyInvoice_routes_1 = __importDefault(require("./agencyInvoice.routes"));
const agencyUser_routes_1 = __importDefault(require("./agencyUser.routes"));
const agencyDashboard_routes_1 = __importDefault(require("./agencyDashboard.routes"));
const hubDashboard_routes_1 = __importDefault(require("./hubDashboard.routes"));
const agency_routes_1 = __importDefault(require("./agency.routes"));
const collectionAgency_routes_1 = __importDefault(require("./collectionAgency.routes"));
const staff_routes_1 = __importDefault(require("./staff.routes"));
const franchise_staff_routes_1 = __importDefault(require("./franchise-staff.routes"));
const franchise_order_routes_1 = __importDefault(require("./franchise-order.routes"));
const customerUser_routes_1 = __importDefault(require("./customerUser.routes"));
const bookingCustomer_routes_1 = __importDefault(require("./bookingCustomer.routes"));
const features_1 = require("../../config/features");
const moduleEnabled_middleware_1 = require("../../middleware/moduleEnabled.middleware");
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
// Single phone login for every internal user (agency / hub / staff / admin)
router.use("/login", unifiedAuth_routes_1.default);
/**
 * @swagger
 * /admin/modules:
 *   get:
 *     summary: Modules available in this deployment
 *     description: >
 *       Drives menus and the role/permission screen. Hidden modules (currently
 *       Collection Agency) are left out.
 *     tags: [Access Management]
 *     responses:
 *       200:
 *         description: '{ modules: ["Dashboard", "Agency Management", ...] }'
 */
router.get("/modules", (_req, res) => res.status(200).json({ success: true, data: { modules: (0, features_1.visibleModules)() } }));
router.use("/role", role_routes_1.default);
// Before /hub, so "dashboard" is not matched as a hub id
router.use("/hub/dashboard", hubDashboard_routes_1.default);
router.use("/hub", hub_routes_1.default);
router.use("/route", route_routes_1.default);
router.use("/vehicle", vehicle_routes_1.default);
router.use("/driver", driver_routes_1.default);
// ---------------------------------------------------------------- parcel flow
router.use("/parcel-order", parcelOrder_routes_1.default);
router.use("/parcel-settlement", parcelSettlement_routes_1.default);
router.use("/invoice", invoice_routes_1.default);
// -------------------------------------------------------------- agency (self)
// An agency acting for itself. `/admin/branch/*` and `/admin/branch-wallet` are
// the pre-rename paths, kept working for the existing frontend — prefer the
// `/admin/agency/*` ones.
router.use("/agency/dashboard", agencyDashboard_routes_1.default);
router.use("/agency/parcel-order", branchParcelOrder_routes_1.default);
router.use("/agency/wallet", branchWalletSelf_routes_1.default);
router.use("/agency/invoice", agencyInvoice_routes_1.default);
router.use("/agency/users", agencyUser_routes_1.default);
router.use("/agency/payout", agencyPayoutSelf_routes_1.default);
// Admin managing every agency's wallet
router.use("/agency-wallet", branchWallet_routes_1.default);
// Admin paying out the commission agencies have earned
router.use("/agency-payout", agencyPayout_routes_1.default);
// Deprecated aliases (same routers, old paths)
router.use("/branch/parcel-order", branchParcelOrder_routes_1.default);
router.use("/branch/wallet", branchWalletSelf_routes_1.default);
router.use("/branch-wallet", branchWallet_routes_1.default);
// ------------------------------------------------------------------ the rest
// Mounted after the /agency/* sub-routes so those win over `/agency/:id`
router.use("/agency", agency_routes_1.default);
// Collection Agency is hidden; the endpoints answer 410 until it is re-enabled
router.use("/collection-agency", (0, moduleEnabled_middleware_1.requireFeature)(features_1.COLLECTION_AGENCY_ENABLED, "Collection Agency"), collectionAgency_routes_1.default);
router.use("/staff", staff_routes_1.default);
router.use("/franchise/staff", franchise_staff_routes_1.default);
router.use("/franchise/orders", franchise_order_routes_1.default);
router.use("/customers", customerUser_routes_1.default);
// Customer Management: the customers who book parcels, rolled up from the
// bookings themselves (CustomerUser above is the app/web signup list)
router.use("/booking-customer", bookingCustomer_routes_1.default);
exports.default = router;
