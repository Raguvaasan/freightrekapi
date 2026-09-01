import * as yup from 'yup';
import { INVOICE_STATUSES } from '../../models/admin/invoice.model';

const objectId = /^[0-9a-fA-F]{24}$/;

const invoiceIdParam = yup.object({
  id: yup
    .string()
    .required('Invoice ID is required')
    .matches(objectId, 'Invalid invoice ID'),
});

export const invoiceByIdSchema = yup.object({
  params: invoiceIdParam,
});

export const invoiceByNumberSchema = yup.object({
  params: yup.object({
    invoiceNumber: yup
      .string()
      .required('Invoice number is required')
      .max(60, 'Invalid invoice number')
      .trim(),
  }),
});

export const invoiceByOrderSchema = yup.object({
  params: yup.object({
    orderId: yup
      .string()
      .required('Order ID is required')
      .matches(objectId, 'Invalid order ID'),
  }),
});

export const updateInvoiceNotesSchema = yup.object({
  body: yup.object({
    notes: yup
      .string()
      .required('Notes are required')
      .min(2, 'Notes must be at least 2 characters')
      .max(1000, 'Notes must not exceed 1000 characters')
      .trim(),
  }),
  params: invoiceIdParam,
});

export const cancelInvoiceSchema = yup.object({
  body: yup
    .object({
      reason: yup
        .string()
        .max(500, 'Reason must not exceed 500 characters')
        .trim()
        .optional(),
    })
    .default({}),
  params: invoiceIdParam,
});

export const invoiceStatusValues = INVOICE_STATUSES;
