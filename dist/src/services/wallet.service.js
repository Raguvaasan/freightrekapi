"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = void 0;
const axios_1 = __importDefault(require("axios"));
const wallet_model_1 = require("../models/wallet/wallet.model");
const order_model_1 = require("../models/wallet/order.model");
const transaction_model_1 = require("../models/wallet/transaction.model");
exports.walletService = {
    async getBalance(userId) {
        try {
            let wallet = await wallet_model_1.Wallet.findOne({ userId });
            if (!wallet) {
                wallet = await wallet_model_1.Wallet.create({ userId, balance: 0 });
            }
            return {
                success: true,
                balance: wallet.balance,
                currency: wallet.currency || 'INR',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to fetch wallet balance',
            };
        }
    },
    async createPaymentOrder(data) {
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
            //     return {
            //         success: false,
            //         message: 'Minimum amount is ₹1',
            //     };
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
            const order = await order_model_1.Order.create({
                orderId,
                userId,
                amount,
                status: 'pending',
                paymentMethod,
                type: 'wallet_recharge',
            });
            // Create Cashfree payment session
            console.log('Creating Cashfree order:', orderId);
            const cashfreeResponse = await axios_1.default.post(`${process.env.CASHFREE_API_URL}/orders`, {
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
            }, {
                headers: {
                    'x-client-id': process.env.CASHFREE_CLIENT_ID,
                    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
                    'x-api-version': '2023-08-01',
                    'Content-Type': 'application/json',
                },
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
        }
        catch (error) {
            console.error('Create payment order error:', error.response?.data || error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create payment order',
            };
        }
    },
    async verifyPayment(data) {
        try {
            const { orderId, paymentId, userId } = data;
            // Find order
            const order = await order_model_1.Order.findOne({ orderId, userId });
            if (!order) {
                return {
                    success: false,
                    message: 'Order not found',
                };
            }
            // Check if already processed
            if (order.status === 'completed') {
                const wallet = await wallet_model_1.Wallet.findOne({ userId });
                return {
                    success: true,
                    status: 'SUCCESS',
                    amount: order.amount,
                    newBalance: wallet?.balance || 0,
                    message: 'Payment already processed',
                };
            }
            // Verify payment with Cashfree
            const verifyResponse = await axios_1.default.get(`${process.env.CASHFREE_API_URL}/orders/${orderId}/payments`, {
                headers: {
                    'x-client-id': process.env.CASHFREE_CLIENT_ID,
                    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
                    'x-api-version': '2023-08-01',
                },
            });
            const payments = verifyResponse.data;
            let paymentSuccess = false;
            // Find the specific payment
            if (Array.isArray(payments)) {
                const payment = payments.find((p) => p.cf_payment_id === paymentId);
                paymentSuccess = payment && payment.payment_status === 'SUCCESS';
            }
            if (paymentSuccess) {
                // Update order status
                order.status = 'completed';
                order.paymentId = paymentId;
                order.completedAt = new Date();
                await order.save();
                // Get current balance
                let wallet = await wallet_model_1.Wallet.findOne({ userId });
                if (!wallet) {
                    wallet = await wallet_model_1.Wallet.create({ userId, balance: 0 });
                }
                const balanceBefore = wallet.balance;
                // Credit wallet
                wallet.balance += order.amount;
                wallet.updatedAt = new Date();
                await wallet.save();
                // Create transaction record
                await transaction_model_1.Transaction.create({
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
            }
            else {
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
        }
        catch (error) {
            console.error('Verify payment error:', error.response?.data || error);
            return {
                success: false,
                message: 'Payment verification failed',
            };
        }
    },
    async getTransactions(query) {
        try {
            const { userId, page, limit, type } = query;
            const filter = { userId };
            if (type) {
                filter.type = type;
            }
            const skip = (page - 1) * limit;
            const transactions = await transaction_model_1.Transaction.find(filter)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
            const total = await transaction_model_1.Transaction.countDocuments(filter);
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
        }
        catch (error) {
            console.error('Get transactions error:', error);
            return {
                success: false,
                message: 'Failed to fetch transactions',
            };
        }
    },
    async processWebhook(orderId, paymentId, amount, userId) {
        try {
            // Find order
            const order = await order_model_1.Order.findOne({ orderId });
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
            let wallet = await wallet_model_1.Wallet.findOne({ userId: order.userId });
            if (!wallet) {
                wallet = await wallet_model_1.Wallet.create({ userId: order.userId, balance: 0 });
            }
            const balanceBefore = wallet.balance;
            // Credit wallet
            wallet.balance += amount;
            wallet.updatedAt = new Date();
            await wallet.save();
            // Create transaction
            await transaction_model_1.Transaction.create({
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
        }
        catch (error) {
            console.error('Process webhook error:', error);
            return { success: false, message: error.message };
        }
    },
};
