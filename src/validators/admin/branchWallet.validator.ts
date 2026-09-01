import * as yup from 'yup';

const objectId = /^[0-9a-fA-F]{24}$/;

const branchIdParam = yup.object({
  branchId: yup
    .string()
    .required('Branch ID is required')
    .matches(objectId, 'Invalid branch ID'),
});

const transactionIdParam = yup.object({
  transactionId: yup
    .string()
    .required('Transaction ID is required')
    .max(120, 'Invalid transaction ID')
    .trim(),
});

const amountField = yup
  .number()
  .typeError('Amount must be a number')
  .required('Amount is required')
  .moreThan(0, 'Amount must be greater than 0')
  .max(1000000, 'Amount must not exceed ₹10,00,000');

// Admin adds money to a branch wallet
export const creditBranchWalletSchema = yup.object({
  body: yup.object({
    amount: amountField,
    remarks: yup.string().max(500, 'Remarks must not exceed 500 characters').trim().optional(),
    paymentMethod: yup.string().max(50).trim().optional(),
    reference: yup
      .string()
      .max(100, 'Reference must not exceed 100 characters')
      .trim()
      .optional(),
  }),
  params: branchIdParam,
});

// Admin deducts money from a branch wallet
export const debitBranchWalletSchema = yup.object({
  body: yup.object({
    amount: amountField,
    remarks: yup.string().max(500, 'Remarks must not exceed 500 characters').trim().optional(),
    paymentMethod: yup.string().max(50).trim().optional(),
    reference: yup
      .string()
      .max(100, 'Reference must not exceed 100 characters')
      .trim()
      .optional(),
  }),
  params: branchIdParam,
});

export const branchWalletByIdSchema = yup.object({
  params: branchIdParam,
});

const percentageField = (label: string) =>
  yup
    .number()
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .max(100, `${label} cannot exceed 100`)
    .optional();

// Admin sets the commission / loading / miscellaneous percentages for a branch.
// Every field is optional; the service rejects a body with none of them.
export const updateBranchPercentagesSchema = yup.object({
  body: yup.object({
    profitPercentage: percentageField('Profit percentage'),
    loadingChargePercentage: percentageField('Loading charge percentage'),
    miscChargePercentage: percentageField('Miscellaneous charge percentage'),
  }),
  params: branchIdParam,
});

export const updateWalletTransactionSchema = yup.object({
  body: yup.object({
    remarks: yup
      .string()
      .required('Remarks are required')
      .min(2, 'Remarks must be at least 2 characters')
      .max(500, 'Remarks must not exceed 500 characters')
      .trim(),
  }),
  params: transactionIdParam,
});

export const reverseWalletTransactionSchema = yup.object({
  body: yup
    .object({
      reason: yup.string().max(500, 'Reason must not exceed 500 characters').trim().optional(),
    })
    .default({}),
  params: transactionIdParam,
});

export const walletTransactionByIdSchema = yup.object({
  params: transactionIdParam,
});
