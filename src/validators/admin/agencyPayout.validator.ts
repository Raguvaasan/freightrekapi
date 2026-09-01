import * as yup from 'yup';

const objectId = /^[0-9a-fA-F]{24}$/;

const agencyIdParam = yup.object({
  agencyId: yup
    .string()
    .required('Agency ID is required')
    .matches(objectId, 'Invalid agency ID'),
});

export const agencyPayoutByAgencySchema = yup.object({
  params: agencyIdParam,
});

/** The "Pay" button. Only the amount is required. */
export const recordAgencyPaymentSchema = yup.object({
  body: yup.object({
    amount: yup
      .number()
      .typeError('Amount must be a number')
      .required('Amount is required')
      .moreThan(0, 'Amount must be greater than 0')
      .max(10000000, 'Amount cannot exceed 1,00,00,000'),
    paymentMethod: yup
      .string()
      .max(50, 'Payment method must not exceed 50 characters')
      .trim()
      .optional(),
    reference: yup
      .string()
      .max(100, 'Reference must not exceed 100 characters')
      .trim()
      .optional(),
    remarks: yup
      .string()
      .max(500, 'Remarks must not exceed 500 characters')
      .trim()
      .optional(),
  }),
  params: agencyIdParam,
});

export const reverseAgencyPaymentSchema = yup.object({
  body: yup.object({
    reason: yup
      .string()
      .max(500, 'Reason must not exceed 500 characters')
      .trim()
      .optional(),
  }),
  params: yup.object({
    paymentId: yup
      .string()
      .required('Payment ID is required')
      .matches(objectId, 'Invalid payment ID'),
  }),
});
