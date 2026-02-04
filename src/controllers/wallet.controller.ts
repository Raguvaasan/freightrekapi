import { Request, Response } from 'express';
import crypto from 'crypto';
import { walletService } from '../services/wallet.service';

export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await walletService.getBalance(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch wallet balance',
    });
  }
};

export const createPaymentOrder = async (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get user details from request (assuming they're available)
    const userEmail = req.user?.email || 'user@example.com';
    const userPhone = req.user?.phone || '9999999999';
    const userName = req.user?.name || 'User';

    const result = await walletService.createPaymentOrder({
      amount,
      paymentMethod,
      userId,
      userEmail,
      userPhone,
      userName,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create payment order',
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await walletService.verifyPayment({
      orderId,
      paymentId,
      userId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed',
    });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as 'credit' | 'debit' | 'refund' | 'reversal' | undefined;

    const result = await walletService.getTransactions({
      userId,
      page,
      limit,
      type,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch transactions',
    });
  }
};

export const cashfreeWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature (IMPORTANT for security)
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    const rawBody = JSON.stringify(req.body);

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET || '')
      .update(`${timestamp}${rawBody}`)
      .digest('base64');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const { data, type } = req.body;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK' && data.order.order_status === 'PAID') {
      const orderId = data.order.order_id;
      const paymentId = data.payment.cf_payment_id;
      const amount = data.payment.payment_amount;
      const userId = data.customer_details?.customer_id;

      const result = await walletService.processWebhook(orderId, paymentId, amount, userId);

      if (!result.success) {
        return res.status(404).send(result.message);
      }
    }

    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).send('Internal Server Error');
  }
};
