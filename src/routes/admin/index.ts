import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import unifiedAuthRoutes from "./unifiedAuth.routes";
import roleRoutes from "./role.routes";
import hubRoutes from "./hub.routes";
import routeRoutes from "./route.routes";
import vehicleRoutes from "./vehicle.routes";
import driverRoutes from "./driver.routes";
import parcelOrderRoutes from "./parcelOrder.routes";
import branchParcelOrderRoutes from "./branchParcelOrder.routes";
import branchWalletRoutes from "./branchWallet.routes";
import agencyPayoutRoutes from "./agencyPayout.routes";
import agencyPayoutSelfRoutes from "./agencyPayoutSelf.routes";
import branchWalletSelfRoutes from "./branchWalletSelf.routes";
import parcelSettlementRoutes from "./parcelSettlement.routes";
import invoiceRoutes from "./invoice.routes";
import agencyInvoiceRoutes from "./agencyInvoice.routes";
import agencyUserRoutes from "./agencyUser.routes";
import agencyDashboardRoutes from "./agencyDashboard.routes";
import hubDashboardRoutes from "./hubDashboard.routes";
import agencyRoutes from "./agency.routes";
import collectionAgencyRoutes from "./collectionAgency.routes";
import staffRoutes from "./staff.routes";
import franchiseStaffRoutes from "./franchise-staff.routes";
import franchiseOrderRoutes from "./franchise-order.routes";
import customerUserRoutes from "./customerUser.routes";
import bookingCustomerRoutes from "./bookingCustomer.routes";
import { visibleModules, COLLECTION_AGENCY_ENABLED } from "../../config/features";
import { requireFeature } from "../../middleware/moduleEnabled.middleware";

const router = Router();

router.use("/auth", authRoutes);

// Single phone login for every internal user (agency / hub / staff / admin)
router.use("/login", unifiedAuthRoutes);

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
router.get("/modules", (_req: Request, res: Response) =>
  res.status(200).json({ success: true, data: { modules: visibleModules() } })
);

router.use("/role", roleRoutes);
// Before /hub, so "dashboard" is not matched as a hub id
router.use("/hub/dashboard", hubDashboardRoutes);
router.use("/hub", hubRoutes);
router.use("/route", routeRoutes);
router.use("/vehicle", vehicleRoutes);
router.use("/driver", driverRoutes);

// ---------------------------------------------------------------- parcel flow
router.use("/parcel-order", parcelOrderRoutes);
router.use("/parcel-settlement", parcelSettlementRoutes);
router.use("/invoice", invoiceRoutes);

// -------------------------------------------------------------- agency (self)
// An agency acting for itself. `/admin/branch/*` and `/admin/branch-wallet` are
// the pre-rename paths, kept working for the existing frontend — prefer the
// `/admin/agency/*` ones.
router.use("/agency/dashboard", agencyDashboardRoutes);
router.use("/agency/parcel-order", branchParcelOrderRoutes);
router.use("/agency/wallet", branchWalletSelfRoutes);
router.use("/agency/invoice", agencyInvoiceRoutes);
router.use("/agency/users", agencyUserRoutes);
router.use("/agency/payout", agencyPayoutSelfRoutes);

// Admin managing every agency's wallet
router.use("/agency-wallet", branchWalletRoutes);

// Admin paying out the commission agencies have earned
router.use("/agency-payout", agencyPayoutRoutes);

// Deprecated aliases (same routers, old paths)
router.use("/branch/parcel-order", branchParcelOrderRoutes);
router.use("/branch/wallet", branchWalletSelfRoutes);
router.use("/branch-wallet", branchWalletRoutes);

// ------------------------------------------------------------------ the rest
// Mounted after the /agency/* sub-routes so those win over `/agency/:id`
router.use("/agency", agencyRoutes);

// Collection Agency is hidden; the endpoints answer 410 until it is re-enabled
router.use(
  "/collection-agency",
  requireFeature(COLLECTION_AGENCY_ENABLED, "Collection Agency"),
  collectionAgencyRoutes
);

router.use("/staff", staffRoutes);
router.use("/franchise/staff", franchiseStaffRoutes);
router.use("/franchise/orders", franchiseOrderRoutes);
router.use("/customers", customerUserRoutes);

// Customer Management: the customers who book parcels, rolled up from the
// bookings themselves (CustomerUser above is the app/web signup list)
router.use("/booking-customer", bookingCustomerRoutes);

export default router;
