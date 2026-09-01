import { Router } from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoiceByOrder,
  getInvoiceSummary,
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
} from '../../validators/admin/invoice.validator';
import { hubModule, hubPermission } from '../../config/hubModule';

/**
 * Hub invoices — base: /hub/invoice
 *
 * Read-only. A hub does not bill anyone: it sees the invoices for the parcels
 * routed through it, so it can check and print what it is handling. The
 * controller scopes every read to the hub's own orders (see scopeFor), and the
 * write endpoints stay on the admin router.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('hub'));
// A direct hub login owns the module; hub staff need it on their HubRole
router.use(requireModulePermission({ hub: hubPermission(hubModule.invoice_management) }, 'read'));

/**
 * @swagger
 * /hub/invoice:
 *   get:
 *     summary: List the invoices for parcels routed through this hub
 *     tags: [Invoice - Hub]
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
 *         name: invoiceNumber
 *         schema: { type: string }
 *       - in: query
 *         name: orderNumber
 *         schema: { type: string }
 *       - in: query
 *         name: paymentType
 *         schema: { type: string, enum: [Paid, To Pay, Credit] }
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
 *       200: { description: Invoices for this hub's parcels }
 *       403: { description: Hub access or "Invoice Management" read permission required }
 */
router.get('/', getAllInvoices);

/**
 * @swagger
 * /hub/invoice/summary:
 *   get:
 *     summary: Billing summary for the parcels routed through this hub
 *     tags: [Invoice - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Totals, overall and per agency }
 */
router.get('/summary', getInvoiceSummary);

/**
 * @swagger
 * /hub/invoice/number/{invoiceNumber}:
 *   get:
 *     summary: Get one invoice by its number
 *     tags: [Invoice - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice }
 *       403: { description: The parcel is not assigned to this hub }
 *       404: { description: Invoice not found }
 * /hub/invoice/order/{orderId}:
 *   get:
 *     summary: Get the invoice raised for one parcel order
 *     tags: [Invoice - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice }
 *       403: { description: The parcel is not assigned to this hub }
 *       404: { description: Invoice not found }
 */
router.get('/number/:invoiceNumber', validate(invoiceByNumberSchema), getInvoiceByNumber);
router.get('/order/:orderId', validate(invoiceByOrderSchema), getInvoiceByOrder);

/**
 * @swagger
 * /hub/invoice/{id}:
 *   get:
 *     summary: Get one invoice by id
 *     tags: [Invoice - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice }
 *       403: { description: The parcel is not assigned to this hub }
 *       404: { description: Invoice not found }
 */
router.get('/:id', validate(invoiceByIdSchema), getInvoiceById);

export default router;
