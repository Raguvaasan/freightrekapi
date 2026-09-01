"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../../controllers/admin/invoice.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const agencyModule_1 = require("../../config/agencyModule");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const invoice_validator_1 = require("../../validators/admin/invoice.validator");
/**
 * An agency's own invoices — base: /admin/agency/invoice
 *
 * Scoped to the logged-in agency, so no agency id is accepted: the invoices it
 * raised plus those for parcels addressed to it for delivery. Raising an
 * invoice is limited to its own bookings; editing notes and cancelling stay
 * with admin.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('agency'));
// A direct agency login owns the module; agency staff need it on their FranchiseRole
router.use((0, parcelActor_middleware_1.requireModulePermission)({ agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.invoice_management) }, 'read'));
/**
 * @swagger
 * /admin/agency/invoice:
 *   get:
 *     summary: This agency's invoices
 *     tags: [Invoice - Agency]
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
 *         schema: { type: string, enum: [issued, cancelled] }
 *       - in: query
 *         name: orderId
 *         schema: { type: string }
 *         description: "Parcel order ObjectId (alias: order)"
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Invoices plus totals for this agency }
 *       403: { description: Agency access required }
 * /admin/agency/invoice/summary:
 *   get:
 *     summary: This agency's billing summary
 *     tags: [Invoice - Agency]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Totals billed by this agency }
 */
router.get('/', invoice_controller_1.getAllInvoices);
router.get('/summary', invoice_controller_1.getInvoiceSummary);
/**
 * @swagger
 * /admin/agency/invoice/number/{invoiceNumber}:
 *   get:
 *     summary: Look up one of this agency's invoices by number
 *     tags: [Invoice - Agency]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice details }
 *       403: { description: Invoice belongs to another agency }
 * /admin/agency/invoice/order/{orderId}:
 *   get:
 *     summary: The invoice for one of this agency's orders
 *     tags: [Invoice - Agency]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice details }
 *       403: { description: Invoice belongs to another agency }
 */
router.get('/number/:invoiceNumber', (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByNumberSchema), invoice_controller_1.getInvoiceByNumber);
router.get('/order/:orderId', (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByOrderSchema), invoice_controller_1.getInvoiceByOrder);
/**
 * @swagger
 * /admin/agency/invoice/order/{orderId}/generate:
 *   post:
 *     summary: Raise an invoice for one of this agency's orders
 *     description: >
 *       New bookings are invoiced automatically. Use this for orders booked
 *       before invoicing existed, or to re-issue after a cancellation (a fresh
 *       invoice number is allocated). Only orders booked at this agency are
 *       accepted.
 *     tags: [Invoice - Agency]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Invoice raised }
 *       403: { description: Order was booked at another agency }
 *       404: { description: Parcel order not found }
 *       409: { description: An issued invoice already exists }
 */
router.post('/order/:orderId/generate', (0, parcelActor_middleware_1.requireModulePermission)({ agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.invoice_management) }, 'write'), (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByOrderSchema), invoice_controller_1.generateInvoiceForOrder);
/**
 * @swagger
 * /admin/agency/invoice/{id}:
 *   get:
 *     summary: Get one of this agency's invoices
 *     tags: [Invoice - Agency]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice details }
 *       403: { description: Invoice belongs to another agency }
 */
router.get('/:id', (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByIdSchema), invoice_controller_1.getInvoiceById);
exports.default = router;
