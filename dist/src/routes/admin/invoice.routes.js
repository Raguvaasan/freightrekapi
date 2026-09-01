"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../../controllers/admin/invoice.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const invoice_validator_1 = require("../../validators/admin/invoice.validator");
const adminModule_1 = require("../../config/adminModule");
const agencyModule_1 = require("../../config/agencyModule");
const hubModule_1 = require("../../config/hubModule");
/**
 * Invoices used to sit inside the admin "Parcel Management" module, so a role
 * written before "Invoice Management" existed still grants them — either module
 * passes. New roles should use "Invoice Management".
 */
const INVOICE_MODULES = (action) => (0, parcelActor_middleware_1.requireModulePermission)({
    admin: [adminModule_1.adminModule.invoice_management, adminModule_1.adminModule.parcel_management],
    agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.invoice_management),
    hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.invoice_management),
}, action);
/**
 * Parcel invoices — base: /admin/invoice
 *
 * An invoice is raised automatically for every parcel booking. Every party and
 * amount is snapshotted onto the invoice, so a reprint shows exactly what was
 * billed even if the agency or customer record changed since.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Admin sees every invoice; an agency reaching the same paths is scoped by the
// controller (see scopeFor) to the invoices it raised plus those for parcels
// addressed to it for delivery, and a hub to the parcels routed through it. The
// write endpoints below stay admin-only, enforced in the controller.
// A hub reads here too — the hub module calls these same paths. Its reads are
// scoped by the controller to the parcels routed through it (see scopeFor), and
// it never bills: the generate / notes / cancel handlers refuse a hub outright.
router.use((0, parcelActor_middleware_1.requireParcelRole)('admin', 'agency', 'hub'));
/**
 * @swagger
 * /admin/invoice:
 *   get:
 *     summary: List invoices
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: agency
 *         schema: { type: string }
 *         description: Agency ObjectId
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [issued, cancelled] }
 *       - in: query
 *         name: invoiceNumber
 *         schema: { type: string }
 *       - in: query
 *         name: orderId
 *         schema: { type: string }
 *         description: "Parcel order ObjectId (alias: order). Returns the single invoice of that order"
 *       - in: query
 *         name: orderNumber
 *         schema: { type: string }
 *       - in: query
 *         name: paymentType
 *         schema: { type: string, enum: [Paid, To Pay, Credit] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches invoice/order number, customer name, mobile or GST
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: >
 *           Invoices plus totals — totalTransportation, totalLoading,
 *           totalMiscellaneous, totalAmount
 */
router.get('/', INVOICE_MODULES('read'), invoice_controller_1.getAllInvoices);
/**
 * @swagger
 * /admin/invoice/summary:
 *   get:
 *     summary: Billing summary, overall and per agency
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: agency
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: >
 *           issuedInvoices, totalTransportation, totalLoading,
 *           totalMiscellaneous, totalAmount, cancelledInvoices, perAgency[]
 */
router.get('/summary', INVOICE_MODULES('read'), invoice_controller_1.getInvoiceSummary);
/**
 * @swagger
 * /admin/invoice/number/{invoiceNumber}:
 *   get:
 *     summary: Look an invoice up by its number
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema: { type: string }
 *         example: INV-2026-27-000001
 *     responses:
 *       200: { description: Invoice details }
 *       404: { description: Invoice not found }
 */
router.get('/number/:invoiceNumber', INVOICE_MODULES('read'), (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByNumberSchema), invoice_controller_1.getInvoiceByNumber);
/**
 * @swagger
 * /admin/invoice/order/{orderId}:
 *   get:
 *     summary: The invoice raised for a parcel order
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice details }
 *       404: { description: No invoice for this order }
 */
router.get('/order/:orderId', INVOICE_MODULES('read'), (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByOrderSchema), invoice_controller_1.getInvoiceByOrder);
/**
 * @swagger
 * /admin/invoice/order/{orderId}/generate:
 *   post:
 *     summary: Raise an invoice for an order that has none
 *     description: >
 *       New bookings are invoiced automatically. Use this for orders booked
 *       before invoicing existed, or to re-issue after a cancellation (a fresh
 *       invoice number is allocated).
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Invoice raised }
 *       404: { description: Parcel order not found }
 *       409: { description: An issued invoice already exists }
 */
router.post('/order/:orderId/generate', INVOICE_MODULES('write'), (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByOrderSchema), invoice_controller_1.generateInvoiceForOrder);
/**
 * @swagger
 * /admin/invoice/{id}:
 *   get:
 *     summary: Get an invoice by ID
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice details }
 *       404: { description: Invoice not found }
 *   patch:
 *     summary: Edit invoice notes
 *     description: >
 *       Only the notes are editable. Amounts follow the order's charges — change
 *       those with PATCH /admin/parcel-order/{id}/charge and the invoice is
 *       revised automatically, keeping a revision trail.
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notes]
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       200: { description: Notes updated }
 */
router.get('/:id', INVOICE_MODULES('read'), (0, validate_middleware_1.validate)(invoice_validator_1.invoiceByIdSchema), invoice_controller_1.getInvoiceById);
router.patch('/:id', INVOICE_MODULES('update'), (0, validate_middleware_1.validate)(invoice_validator_1.updateInvoiceNotesSchema), invoice_controller_1.updateInvoiceNotes);
/**
 * @swagger
 * /admin/invoice/{id}/cancel:
 *   post:
 *     summary: Cancel an invoice
 *     description: >
 *       The record is kept and marked cancelled so the numbering stays intact.
 *       Deleting a parcel order cancels its invoice automatically.
 *     tags: [Invoice]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Booking cancelled by customer" }
 *     responses:
 *       200: { description: Invoice cancelled }
 *       409: { description: Already cancelled }
 */
router.post('/:id/cancel', INVOICE_MODULES('update'), (0, validate_middleware_1.validate)(invoice_validator_1.cancelInvoiceSchema), invoice_controller_1.cancelInvoice);
exports.default = router;
