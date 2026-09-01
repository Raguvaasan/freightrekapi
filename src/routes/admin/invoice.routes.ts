import { Router } from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoiceByOrder,
  getInvoiceSummary,
  generateInvoiceForOrder,
  updateInvoiceNotes,
  cancelInvoice,
} from '../../controllers/admin/invoice.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  invoiceByIdSchema,
  invoiceByNumberSchema,
  invoiceByOrderSchema,
  updateInvoiceNotesSchema,
  cancelInvoiceSchema,
} from '../../validators/admin/invoice.validator';
import { adminModule } from '../../config/adminModule';
import { agencyModule, agencyPermission } from '../../config/agencyModule';
import { hubModule, hubPermission } from '../../config/hubModule';

/**
 * Invoices used to sit inside the admin "Parcel Management" module, so a role
 * written before "Invoice Management" existed still grants them — either module
 * passes. New roles should use "Invoice Management".
 */
const INVOICE_MODULES = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission(
    {
      admin: [adminModule.invoice_management, adminModule.parcel_management],
      agency: agencyPermission(agencyModule.invoice_management),
      hub: hubPermission(hubModule.invoice_management),
    },
    action
  );

/**
 * Parcel invoices — base: /admin/invoice
 *
 * An invoice is raised automatically for every parcel booking. Every party and
 * amount is snapshotted onto the invoice, so a reprint shows exactly what was
 * billed even if the agency or customer record changed since.
 */
const router = Router();

router.use(authMiddleware);
// Admin sees every invoice; an agency reaching the same paths is scoped by the
// controller (see scopeFor) to the invoices it raised plus those for parcels
// addressed to it for delivery, and a hub to the parcels routed through it. The
// write endpoints below stay admin-only, enforced in the controller.
// A hub reads here too — the hub module calls these same paths. Its reads are
// scoped by the controller to the parcels routed through it (see scopeFor), and
// it never bills: the generate / notes / cancel handlers refuse a hub outright.
router.use(requireParcelRole('admin', 'agency', 'hub'));

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
router.get('/', INVOICE_MODULES('read'), getAllInvoices);

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
router.get(
  '/summary',
  INVOICE_MODULES('read'),
  getInvoiceSummary
);

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
router.get(
  '/number/:invoiceNumber',
  INVOICE_MODULES('read'),
  validate(invoiceByNumberSchema),
  getInvoiceByNumber
);

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
router.get(
  '/order/:orderId',
  INVOICE_MODULES('read'),
  validate(invoiceByOrderSchema),
  getInvoiceByOrder
);

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
router.post(
  '/order/:orderId/generate',
  INVOICE_MODULES('write'),
  validate(invoiceByOrderSchema),
  generateInvoiceForOrder
);

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
router.get(
  '/:id',
  INVOICE_MODULES('read'),
  validate(invoiceByIdSchema),
  getInvoiceById
);

router.patch(
  '/:id',
  INVOICE_MODULES('update'),
  validate(updateInvoiceNotesSchema),
  updateInvoiceNotes
);

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
router.post(
  '/:id/cancel',
  INVOICE_MODULES('update'),
  validate(cancelInvoiceSchema),
  cancelInvoice
);

export default router;
