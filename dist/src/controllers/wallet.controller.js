"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashfreeWebhook = exports.getTransactions = exports.verifyPayment = exports.createPaymentOrder = exports.getBalance = void 0;
const crypto_1 = __importDefault(require("crypto"));
const wallet_service_1 = require("../services/wallet.service");
const adminUser_model_1 = require("../models/admin/adminUser.model");
const agency_model_1 = require("../models/admin/agency.model");
const staff_model_1 = require("../models/admin/staff.model");
const getBalance = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        // Check if user is admin
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            if (role.isRoot === true) {
                // Admin: return total balance of all franchises
                const result = await wallet_service_1.walletService.getAllFranchiseBalance();
                if (!result.success) {
                    return res.status(400).json(result);
                }
                return res.status(200).json(result);
            }
        }
        // Check if user is a franchise staff - use franchise's wallet
        let walletUserId = userId;
        const staff = await staff_model_1.Staff.findById(userId);
        if (staff && staff.type === 'franchise' && staff.franchiseId) {
            walletUserId = staff.franchiseId.toString();
        }
        const result = await wallet_service_1.walletService.getBalance(walletUserId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch wallet balance',
        });
    }
};
exports.getBalance = getBalance;
const createPaymentOrder = async (req, res) => {
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
        const result = await wallet_service_1.walletService.createPaymentOrder({
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
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to create payment order',
        });
    }
};
exports.createPaymentOrder = createPaymentOrder;
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const result = await wallet_service_1.walletService.verifyPayment({
            orderId,
            paymentId,
            userId,
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Payment verification failed',
        });
    }
};
exports.verifyPayment = verifyPayment;
const getTransactions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type;
        // Check if user is admin
        let isAdmin = false;
        let franchiseUserIds = [];
        const user = await adminUser_model_1.AdminUser.findById(userId).populate('roleId');
        if (user && user.roleId) {
            const role = user.roleId;
            isAdmin = role.isRoot === true;
            // If admin, get all franchise (Agency) user IDs
            if (isAdmin) {
                const agencies = await agency_model_1.Agency.find({}, '_id');
                franchiseUserIds = agencies.map(agency => agency._id.toString());
            }
        }
        // If franchise staff, use franchise's ID for transactions
        let walletUserId = userId;
        if (!isAdmin) {
            const staff = await staff_model_1.Staff.findById(userId);
            if (staff && staff.type === 'franchise' && staff.franchiseId) {
                walletUserId = staff.franchiseId.toString();
            }
        }
        const result = await wallet_service_1.walletService.getTransactions({
            userId: walletUserId,
            page,
            limit,
            type,
            isAdmin,
            franchiseUserIds,
        });
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch transactions',
        });
    }
};
exports.getTransactions = getTransactions;
const cashfreeWebhook = async (req, res) => {
    try {
        // Verify webhook signature (IMPORTANT for security)
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const rawBody = JSON.stringify(req.body);
        // Calculate expected signature
        const expectedSignature = crypto_1.default
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
            const result = await wallet_service_1.walletService.processWebhook(orderId, paymentId, amount, userId);
            if (!result.success) {
                return res.status(404).send(result.message);
            }
        }
        return res.status(200).send('OK');
    }
    catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).send('Internal Server Error');
    }
};
exports.cashfreeWebhook = cashfreeWebhook;
