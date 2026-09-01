import { Router } from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoiceByOrder,
  getInvoiceSummary,
  generateInvoiceForOrder,
} from '../../controllers/admin/invoice.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { agencyModule, agencyPermission } from '../../config/agencyModule';
import { validate } from '../../middleware/validate.middleware';
import {
  invoiceByIdSchema,
  invoiceByNumberSchema,
  invoiceByOrderSchema,
} from '../../validators/admin/invoice.validator';

/**
 * An agency's own invoices — base: /admin/agency/invoice
 *
 * Scoped to the logged-in agency, so no agency id is accepted: the invoices it
 * raised plus those for parcels addressed to it for delivery. Raising an
 * invoice is limited to its own bookings; editing notes and cancelling stay
 * with admin.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('agency'));
// A direct agency login owns the module; agency staff need it on their FranchiseRole
router.use(
  requireModulePermission({ agency: agencyPermission(agencyModule.invoice_management) }, 'read')
);

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
router.get('/', getAllInvoices);
router.get('/summary', getInvoiceSummary);

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
router.get('/number/:invoiceNumber', validate(invoiceByNumberSchema), getInvoiceByNumber);
router.get('/order/:orderId', validate(invoiceByOrderSchema), getInvoiceByOrder);

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
router.post(
  '/order/:orderId/generate',
  requireModulePermission({ agency: agencyPermission(agencyModule.invoice_management) }, 'write'),
  validate(invoiceByOrderSchema),
  generateInvoiceForOrder
);

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
router.get('/:id', validate(invoiceByIdSchema), getInvoiceById);

export default router;
