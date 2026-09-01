"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingCustomer_controller_1 = require("../../controllers/admin/bookingCustomer.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const bookingCustomer_validator_1 = require("../../validators/admin/bookingCustomer.validator");
const adminModule_1 = require("../../config/adminModule");
/**
 * Customer Management — base: /admin/booking-customer
 *
 * The customers who book parcels. They are not a collection of their own: each
 * booking carries its customer's name, mobile number, address and GST, so a
 * customer here is every booking sharing a MOBILE NUMBER rolled into one row.
 * That mobile number is the id the details endpoint takes.
 *
 * Read-only by design — a customer's details are edited on the booking they
 * belong to (PUT /admin/parcel-order/{id}), not here, or the two screens would
 * disagree about which name is current.
 *
 * Admin sees every customer. An agency login sees only the customers who booked
 * with it, since the same scoping the parcel list applies is applied here.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('admin', 'agency'));
/**
 * @swagger
 * /admin/booking-customer:
 *   get:
 *     summary: Every booking customer with what they have booked
 *     description: >
 *       One row per mobile number. `name`, `address` and `gstNumber` come from
 *       the customer's most recent booking; `outstandingAmount` is the To Pay
 *       and Credit bookings, `paidAmount` the ones already settled. `totals` is
 *       across every customer matching the filters, not just this page.
 *     tags: [Customer Management - Booking]
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
 *         description: Matches customer name, mobile number or GST
 *       - in: query
 *         name: agency
 *         schema: { type: string }
 *         description: Only customers who booked at this agency (admin only)
 *       - in: query
 *         name: paymentType
 *         schema: { type: string, enum: [Paid, To Pay, Credit] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [recent, orders, amount, name], default: recent }
 *     responses:
 *       200:
 *         description: >
 *           customers[] { serialNo, mobileNumber, name, address, gstNumber,
 *           totalOrders, deliveredOrders, pendingOrders, totalAmount,
 *           paidAmount, outstandingAmount, firstOrderDate, lastOrderDate,
 *           agencies[] }, totals and pagination
 *       403: { description: Admin or agency access required }
 */
router.get('/', (0, parcelActor_middleware_1.requireAdminPermission)(adminModule_1.adminModule.parcel_management, 'read'), bookingCustomer_controller_1.getAllBookingCustomers);
/**
 * @swagger
 * /admin/booking-customer/{mobileNumber}:
 *   get:
 *     summary: One customer's details and every order they have placed
 *     description: >
 *       `summary` is the customer's lifetime position and does not move as the
 *       order list is filtered; `totals` next to `orders` is the filtered set.
 *       The order rows are the same shape the parcel list screen uses, invoice
 *       included, so the two can share a table.
 *     tags: [Customer Management - Booking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: mobileNumber
 *         required: true
 *         schema: { type: string, example: '9876543210' }
 *         description: The booking customer's mobile number — their identity here
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: agency
 *         schema: { type: string }
 *         description: Only this customer's bookings at one agency (admin only)
 *       - in: query
 *         name: paymentType
 *         schema: { type: string, enum: [Paid, To Pay, Credit] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: >
 *           customer, summary, orders[] (full parcel orders), totals, pagination
 *       404: { description: No bookings found for this mobile number }
 */
router.get('/:mobileNumber', (0, parcelActor_middleware_1.requireAdminPermission)(adminModule_1.adminModule.parcel_management, 'read'), (0, validate_middleware_1.validate)(bookingCustomer_validator_1.bookingCustomerByMobileSchema), bookingCustomer_controller_1.getBookingCustomer);
exports.default = router;
