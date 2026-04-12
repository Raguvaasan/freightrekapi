import axios from 'axios';
import { Wallet } from '../models/wallet/wallet.model';
import { Order } from '../models/wallet/order.model';
import { Transaction } from '../models/wallet/transaction.model';
import { Agency } from '../models/admin/agency.model';

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
  paymentId?: string;
  userId: string;
}

interface TransactionQuery {
  userId: string;
  page: number;
  limit: number;
  type?: 'credit' | 'debit' | 'refund' | 'reversal';
  isAdmin?: boolean;
  franchiseUserIds?: string[];
}

export const walletService = {
  async getBalance(userId: string) {
    try {
      // Atomic: find or create wallet in a single DB call
      const wallet = (await Wallet.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, balance: 0 } },
        { new: true, upsert: true, lean: true }
      ))!;

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

  async getAllFranchiseBalance() {
    try {
      // Get all franchise user IDs
      const agencies = await Agency.find({}, '_id');
      const franchiseIds = agencies.map(a => a._id.toString());

      // Sum balance of all franchise wallets
      const result = await Wallet.aggregate([
        { $match: { userId: { $in: franchiseIds } } },
        { $group: { _id: null, totalBalance: { $sum: '$balance' } } },
      ]);

      const totalBalance = result.length > 0 ? result[0].totalBalance : 0;

      return {
        success: true,
        balance: totalBalance,
        currency: 'INR',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch franchise balance',
      };
    }
  },

  async createPaymentOrder(data: CreateOrderData) {
    try {
      const { amount, paymentMethod, userId, userEmail, userPhone, userName } = data;

      // Log environment variables for debugging
      console.log('Cashfree Config:', {
        apiUrl: process.env.CASHFREE_API_URL,
        clientId: process.env.CASHFREE_CLIENT_ID ? 'SET' : 'NOT SET',
        clientSecret: process.env.CASHFREE_CLIENT_SECRET ? 'SET' : 'NOT SET',
        backendUrl: process.env.BACKEND_URL,
      });

      // Validate amount
      // if (amount < 1) {
      //   return {
      //     success: false,
      //     message: 'Minimum amount is ₹1',
      //   };
      // }

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
      console.log('Creating Cashfree order:', orderId);
      console.log('Cashfree Request:', {
        url: `${process.env.CASHFREE_API_URL}/orders`,
        orderId,
        amount,
        customerDetails: {
          customer_id: userId,
          customer_email: userEmail || 'user@example.com',
          customer_phone: userPhone || '9999999999',
        },
      });

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

      console.log('✅ Cashfree Response:', {
        orderId: cashfreeResponse.data.order_id,
        sessionId: cashfreeResponse.data.payment_session_id?.substring(0, 30) + '...',
        status: cashfreeResponse.status,
      });

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
      console.error('❌ Cashfree API Error:');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create payment order',
        error: error.response?.data || { message: error.message },
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
      console.log(`🔍 Verifying payment for order: ${orderId}`);
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

      console.log('💳 Cashfree payments response:', JSON.stringify(verifyResponse.data, null, 2));

      const payments = verifyResponse.data;
      let paymentSuccess = false;
      let successfulPaymentId = paymentId;

      // Find the successful payment
      if (Array.isArray(payments)) {
        const payment = paymentId 
          ? payments.find((p: any) => p.cf_payment_id === paymentId)
          : payments.find((p: any) => p.payment_status === 'SUCCESS');
        
        if (payment) {
          paymentSuccess = payment.payment_status === 'SUCCESS';
          successfulPaymentId = payment.cf_payment_id;
          console.log(`✅ Payment found - Status: ${payment.payment_status}, ID: ${successfulPaymentId}`);
        } else {
          console.log('❌ No successful payment found');
        }
      }

      if (paymentSuccess) {
        // Update order status
        order.status = 'completed';
        order.paymentId = successfulPaymentId;
        order.completedAt = new Date();
        await order.save();
        
        console.log(`✅ Order marked as completed: ${orderId}`);

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
          paymentId: successfulPaymentId,
          balanceBefore,
          balanceAfter: wallet.balance,
          metadata: {
            source: 'cashfree',
            orderType: 'wallet_recharge',
          },
        });
        
        console.log(`💰 Wallet credited: ₹${order.amount}, New balance: ₹${wallet.balance}`);

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
      const { userId, page, limit, type, isAdmin, franchiseUserIds } = query;

      // If admin, return all franchise transactions (not admin's own)
      // Otherwise, filter by logged-in userId
      const filter: any = {};
      
      if (isAdmin && franchiseUserIds && franchiseUserIds.length > 0) {
        // Admin: show only franchise transactions
        filter.userId = { $in: franchiseUserIds };
      } else {
        // Non-admin: show only their own transactions
        filter.userId = userId;
      }
      
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

      // Get unique userIds to fetch franchise names
      const userIds = [...new Set(transactions.map(txn => txn.userId))];
      const agencies = await Agency.find({ _id: { $in: userIds } }, 'agencyName');
      const agencyMap = new Map(agencies.map(agency => [agency._id.toString(), agency.agencyName]));

      // Format response with franchise names
      const formattedTransactions = transactions.map((txn) => ({
        id: txn.transactionId,
        userId: txn.userId,
        franchiseName: agencyMap.get(txn.userId) || 'Unknown',
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
