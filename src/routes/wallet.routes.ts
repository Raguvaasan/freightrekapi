import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  getBalance,
  createPaymentOrder,
  verifyPayment,
  getTransactions,
  cashfreeWebhook,
} from '../controllers/wallet.controller';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  getTransactionsSchema,
} from '../validators/wallet.validator';

const router = Router();

// Protected routes (require authentication)
router.get('/balance', authMiddleware, getBalance);

router.post(
  '/create-payment-order',
  authMiddleware,
  validate(createPaymentOrderSchema),
  createPaymentOrder
);

router.post(
  '/verify-payment',
  authMiddleware,
  validate(verifyPaymentSchema),
  verifyPayment
);

router.get(
  '/transactions',
  authMiddleware,
  validate(getTransactionsSchema),
  getTransactions
);

export default router;
