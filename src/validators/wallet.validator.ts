import * as yup from 'yup';

export const createPaymentOrderSchema = yup.object().shape({
  amount: yup
    .number()
    .required('Amount is required')
    .min(1, 'Minimum amount is ₹1')
    .max(100000, 'Maximum amount is ₹100,000'),
  paymentMethod: yup
    .string()
    .required('Payment method is required')
    .oneOf(['upi', 'card', 'netbanking', 'wallet'], 'Invalid payment method'),
});

export const verifyPaymentSchema = yup.object().shape({
  orderId: yup.string().required('Order ID is required'),
  paymentId: yup.string().optional(),
});

export const getTransactionsSchema = yup.object().shape({
  page: yup.number().min(1, 'Page must be at least 1'),
  limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
  type: yup.string().oneOf(['credit', 'debit', 'refund', 'reversal'], 'Invalid transaction type'),
});
