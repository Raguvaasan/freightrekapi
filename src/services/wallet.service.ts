import axios from 'axios';
import { Wallet } from '../models/wallet/wallet.model';
import { Order } from '../models/wallet/order.model';
import { Transaction } from '../models/wallet/transaction.model';

interface CreateOrderData {
  amount: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet';
  userId: string;
  userEmail: string;
  userPhone: string;
  userName: string;
}

interface VerifyPaymentData {
  orderId: string;
  paymentId: string;
  userId: string;
}

interface TransactionQuery {
  userId: string;
  page: number;
  limit: number;
  type?: 'credit' | 'debit' | 'refund' | 'reversal';
}

export const walletService = {
  async getBalance(userId: string) {
    try {
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0 });
      }

      return {
        success: true,
        balance: wallet.balance,
        currency: wallet.currency || 'INR',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch wallet balance',
      };
    }
  },

  async createPaymentOrder(data: CreateOrderData) {
    try {
      const { amount, paymentMethod, userId, userEmail, userPhone, userName } = data;

      // Validate amount
      if (amount < 100) {
        return {
          success: false,
          message: 'Minimum amount is ₹100',
        };
      }

      if (amount > 100000) {
        return {
          success: false,
          message: 'Maximum amount is ₹100,000',
        };
      }

      // Generate unique order ID
      const orderId = `ORDER_${userId}_${Date.now()}`;

      // Create order in database
      const order = await Order.create({
        orderId,
        userId,
        amount,
        status: 'pending',
        paymentMethod,
        type: 'wallet_recharge',
      });

      // Create Cashfree payment session
      const cashfreeResponse = await axios.post(
        `${process.env.CASHFREE_API_URL}/orders`,
        {
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: userId,
            customer_email: userEmail || 'user@example.com',
            customer_phone: userPhone || '9999999999',
            customer_name: userName || 'User',
          },
          order_meta: {
            return_url: `${process.env.FRONTEND_URL}/admin/wallet/payment-callback?order_id={order_id}`,
            notify_url: `${process.env.BACKEND_URL}/webhook/cashfree`,
            payment_methods: paymentMethod === 'card' ? 'cc,dc' : 'upi,nb',
          },
        },
        {
          headers: {
            'x-client-id': process.env.CASHFREE_CLIENT_ID,
            'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json',
          },
        }
      );

      // Save session ID
      order.sessionId = cashfreeResponse.data.payment_session_id;
      order.cashfreeOrderId = cashfreeResponse.data.order_id;
      await order.save();

      return {
        success: true,
        orderId: orderId,
        sessionId: cashfreeResponse.data.payment_session_id,
        amount: amount,
        currency: 'INR',
      };
    } catch (error: any) {
      console.error('Create payment order error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create payment order',
      };
    }
  },

  async verifyPayment(data: VerifyPaymentData) {
    try {
      const { orderId, paymentId, userId } = data;

      // Find order
      const order = await Order.findOne({ orderId, userId });

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
        };
      }

      // Check if already processed
      if (order.status === 'completed') {
        const wallet = await Wallet.findOne({ userId });
        return {
          success: true,
          status: 'SUCCESS',
          amount: order.amount,
          newBalance: wallet?.balance || 0,
          message: 'Payment already processed',
        };
      }

      // Verify payment with Cashfree
      const verifyResponse = await axios.get(
        `${process.env.CASHFREE_API_URL}/orders/${orderId}/payments`,
        {
          headers: {
            'x-client-id': process.env.CASHFREE_CLIENT_ID,
            'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
            'x-api-version': '2023-08-01',
          },
        }
      );

      const payments = verifyResponse.data;
      let paymentSuccess = false;

      // Find the specific payment
      if (Array.isArray(payments)) {
        const payment = payments.find((p: any) => p.cf_payment_id === paymentId);
        paymentSuccess = payment && payment.payment_status === 'SUCCESS';
      }

      if (paymentSuccess) {
        // Update order status
        order.status = 'completed';
        order.paymentId = paymentId;
        order.completedAt = new Date();
        await order.save();

        // Get current balance
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          wallet = await Wallet.create({ userId, balance: 0 });
        }

        const balanceBefore = wallet.balance;

        // Credit wallet
        wallet.balance += order.amount;
        wallet.updatedAt = new Date();
        await wallet.save();

        // Create transaction record
        await Transaction.create({
          transactionId: `TXN_${Date.now()}_${userId}`,
          userId,
          orderId,
          amount: order.amount,
          type: 'credit',
          status: 'completed',
          description: 'Wallet Recharge',
          paymentMethod: order.paymentMethod,
          paymentId,
          balanceBefore,
          balanceAfter: wallet.balance,
          metadata: {
            source: 'cashfree',
            orderType: 'wallet_recharge',
          },
        });

        return {
          success: true,
          status: 'SUCCESS',
          amount: order.amount,
          newBalance: wallet.balance,
        };
      } else {
        // Payment failed
        order.status = 'failed';
        order.failedAt = new Date();
        await order.save();

        return {
          success: false,
          status: 'FAILED',
          message: 'Payment verification failed',
        };
      }
    } catch (error: any) {
      console.error('Verify payment error:', error.response?.data || error);
      return {
        success: false,
        message: 'Payment verification failed',
      };
    }
  },

  async getTransactions(query: TransactionQuery) {
    try {
      const { userId, page, limit, type } = query;

      const filter: any = { userId };
      if (type) {
        filter.type = type;
      }

      const skip = (page - 1) * limit;

      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await Transaction.countDocuments(filter);

      // Format response
      const formattedTransactions = transactions.map((txn) => ({
        id: txn.transactionId,
        amount: txn.amount,
        type: txn.type,
        status: txn.status,
        description: txn.description,
        paymentMethod: txn.paymentMethod,
        orderId: txn.orderId,
        createdAt: txn.createdAt,
        balanceBefore: txn.balanceBefore,
        balanceAfter: txn.balanceAfter,
      }));

      return {
        success: true,
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Get transactions error:', error);
      return {
        success: false,
        message: 'Failed to fetch transactions',
      };
    }
  },

  async processWebhook(orderId: string, paymentId: string, amount: number, userId: string) {
    try {
      // Find order
      const order = await Order.findOne({ orderId });

      if (!order) {
        console.error('Order not found:', orderId);
        return { success: false, message: 'Order not found' };
      }

      // Check if already processed
      if (order.status === 'completed') {
        return { success: true, message: 'Already processed' };
      }

      // Update order
      order.status = 'completed';
      order.paymentId = paymentId;
      order.completedAt = new Date();
      await order.save();

      // Get wallet
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = await Wallet.create({ userId: order.userId, balance: 0 });
      }

      const balanceBefore = wallet.balance;

      // Credit wallet
      wallet.balance += amount;
      wallet.updatedAt = new Date();
      await wallet.save();

      // Create transaction
      await Transaction.create({
        transactionId: `TXN_${Date.now()}_${order.userId}`,
        userId: order.userId,
        orderId,
        amount: amount,
        type: 'credit',
        status: 'completed',
        description: 'Wallet Recharge',
        paymentMethod: order.paymentMethod,
        paymentId,
        balanceBefore,
        balanceAfter: wallet.balance,
        metadata: {
          source: 'cashfree_webhook',
          orderType: 'wallet_recharge',
        },
      });

      console.log(`✅ Wallet credited: User ${order.userId}, Amount ₹${amount}`);
      return { success: true };
    } catch (error: any) {
      console.error('Process webhook error:', error);
      return { success: false, message: error.message };
    }
  },
};
