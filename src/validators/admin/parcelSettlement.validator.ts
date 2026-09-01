import * as yup from 'yup';

const objectId = /^[0-9a-fA-F]{24}$/;
import { SETTLEMENT_STATUSES } from '../../models/admin/parcelSettlement.model';

const settlementIdParam = yup.object({
  id: yup
    .string()
    .required('Settlement ID is required')
    .matches(objectId, 'Invalid settlement ID'),
});

export const settlementByIdSchema = yup.object({
  params: settlementIdParam,
});

export const settleOrderSchema = yup.object({
  params: yup.object({
    orderId: yup
      .string()
      .required('Order ID is required')
      .matches(objectId, 'Invalid order ID'),
  }),
});

export const reverseSettlementSchema = yup.object({
  body: yup
    .object({
      reason: yup
        .string()
        .max(500, 'Reason must not exceed 500 characters')
        .trim()
        .optional(),
    })
    .default({}),
  params: settlementIdParam,
});

export const updateSettlementNotesSchema = yup.object({
  body: yup.object({
    notes: yup
      .string()
      .required('Notes are required')
      .min(2, 'Notes must be at least 2 characters')
      .max(1000, 'Notes must not exceed 1000 characters')
      .trim(),
  }),
  params: settlementIdParam,
});

export const settlementStatusValues = SETTLEMENT_STATUSES;
