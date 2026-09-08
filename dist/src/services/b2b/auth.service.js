"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.b2bAuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const b2bOtp_model_1 = require("../../models/b2b/b2bOtp.model");
const b2bUser_model_1 = require("../../models/b2b/b2bUser.model");
const jwt_1 = require("../../utils/jwt");
const mongoose_1 = require("mongoose");
const b2bOrder_model_1 = require("../../models/b2b/b2bOrder.model");
const b2bInvoice_model_1 = require("../../models/b2b/b2bInvoice.model");
const sendSms = async (mobileNumber, otp, countryCode = '+91') => {
    const apiKey = process.env.PING4SMS_API_KEY;
    const sender = process.env.PING4SMS_SENDER;
    const templateId = process.env.PING4SMS_TEMPLATE_ID;
    const route = process.env.PING4SMS_ROUTE || '2';
    const fullPhone = `${countryCode.replace('+', '')}${mobileNumber.replace(/^\+/, '')}`;
    // Keep this identical to the working Agency OTP template for DLT matching.
    const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
    const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(message)}&templateid=${templateId}`;
    console.log('[Ping4SMS] B2B OTP URL:', url);
    const response = await axios_1.default.get(url, { timeout: 10000 });
    console.log('[Ping4SMS] B2B OTP Response:', JSON.stringify(response.data));
    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    if (body.includes('-1') || body.includes('-2') || body.toLowerCase().includes('error') || body.includes('INVALID')) {
        throw new Error(`SMS sending failed: ${body}`);
    }
};
const normalizeMobile = (mobileNumber) => String(mobileNumber).replace(/\D/g, '').slice(-10);
exports.b2bAuthService = {
    async register(input) {
        const mobileNumber = normalizeMobile(input.mobileNumber);
        const existing = await b2bUser_model_1.B2bUser.findOne({ mobileNumber });
        if (existing)
            return { success: false, message: 'B2B user already exists' };
        const user = await b2bUser_model_1.B2bUser.create({ ...input, mobileNumber });
        return { success: true, message: 'B2B registered successfully', data: user };
    },
    async getById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return { success: false, message: 'Invalid B2B user ID' };
        const user = await b2bUser_model_1.B2bUser.findById(id);
        if (!user)
            return { success: false, message: 'B2B user not found' };
        return { success: true, data: user };
    },
    async getCustomerDetails(id, query = {}) {
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return { success: false, code: 400, message: 'Invalid B2B user ID' };
        const user = await b2bUser_model_1.B2bUser.findById(id).lean();
        if (!user)
            return { success: false, code: 404, message: 'B2B user not found' };
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
        const filter = { b2bUserId: user._id };
        if (query.status)
            filter.status = String(query.status).trim().toUpperCase();
        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate)
                filter.createdAt.$gte = new Date(String(query.startDate));
            if (query.endDate) {
                const end = new Date(String(query.endDate));
                end.setDate(end.getDate() + 1);
                filter.createdAt.$lt = end;
            }
        }
        const allOrders = await b2bOrder_model_1.B2bOrder.find({ b2bUserId: user._id }).select('status totalAmount createdAt').lean();
        const deliveredOrders = allOrders.filter((order) => order.status === 'DELIVERED').length;
        const lifetimeTotal = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const [filteredTotal, filteredSums] = await Promise.all([
            b2bOrder_model_1.B2bOrder.countDocuments(filter),
            b2bOrder_model_1.B2bOrder.aggregate([
                { $match: filter },
                { $group: { _id: null, amount: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
            ]),
        ]);
        const orders = await b2bOrder_model_1.B2bOrder.find(filter)
            .populate('selectedVehicleId', 'vehicleType capacityKg ratePerKm status')
            .populate('driverId', 'driverName phoneNumber licenseNumber status')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const invoices = await b2bInvoice_model_1.B2bInvoice.find({ order: { $in: orders.map((order) => order._id) } }).lean();
        const invoiceByOrder = new Map(invoices.map((invoice) => [String(invoice.order), invoice]));
        const ordersWithInvoices = orders.map((order) => ({
            ...order,
            invoice: invoiceByOrder.get(String(order._id)) || null,
        }));
        const filteredAmount = filteredSums[0]?.amount || 0;
        return {
            success: true,
            data: {
                customer: user,
                summary: {
                    totalOrders: allOrders.length,
                    deliveredOrders,
                    pendingOrders: allOrders.length - deliveredOrders,
                    totalAmount: lifetimeTotal,
                    firstOrderDate: allOrders.length ? allOrders.reduce((first, order) => order.createdAt < first ? order.createdAt : first, allOrders[0].createdAt) : null,
                    lastOrderDate: allOrders.length ? allOrders.reduce((last, order) => order.createdAt > last ? order.createdAt : last, allOrders[0].createdAt) : null,
                },
                orders: ordersWithInvoices,
                totals: {
                    orders: filteredTotal,
                    amount: filteredAmount,
                },
                pagination: {
                    total: filteredTotal,
                    page,
                    limit,
                    totalPages: Math.ceil(filteredTotal / limit),
                },
            },
        };
    },
    async update(id, payload) {
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return { success: false, message: 'Invalid B2B user ID' };
        const update = {};
        for (const field of ['name', 'mobileNumber', 'address', 'state', 'pincode', 'gstNumber', 'status']) {
            if (payload[field] !== undefined)
                update[field] = payload[field];
        }
        const user = await b2bUser_model_1.B2bUser.findByIdAndUpdate(id, update, { new: true, runValidators: true });
        if (!user)
            return { success: false, message: 'B2B user not found' };
        return { success: true, message: 'B2B user updated successfully', data: user };
    },
    async list(query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
        const search = String(query.search || '').trim();
        const filter = {};
        if (search)
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
                { gstNumber: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } },
                { pincode: { $regex: search, $options: 'i' } },
            ];
        if (query.status)
            filter.status = query.status;
        const [users, total] = await Promise.all([
            b2bUser_model_1.B2bUser.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
            b2bUser_model_1.B2bUser.countDocuments(filter),
        ]);
        return { success: true, data: { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } };
    },
    async sendOtp(mobileNumber, countryCode = '+91') {
        mobileNumber = normalizeMobile(mobileNumber);
        const user = await b2bUser_model_1.B2bUser.findOne({ mobileNumber, status: 'Active' });
        if (!user)
            return { success: false, message: 'No active B2B user found with this mobile number' };
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await b2bOtp_model_1.B2bOtp.deleteMany({ mobileNumber });
        await b2bOtp_model_1.B2bOtp.create({ mobileNumber, otp, expiresAt });
        try {
            await sendSms(mobileNumber, otp, countryCode);
            return { success: true, message: 'OTP sent successfully' };
        }
        catch (error) {
            await b2bOtp_model_1.B2bOtp.deleteOne({ mobileNumber, otp });
            return { success: false, message: error.message || 'Error sending OTP' };
        }
    },
    async verifyOtp(mobileNumber, otp) {
        mobileNumber = normalizeMobile(mobileNumber);
        const record = await b2bOtp_model_1.B2bOtp.findOne({ mobileNumber, used: false }).sort({ createdAt: -1 });
        if (!record)
            return { success: false, message: 'OTP not found. Please request a new one' };
        if (new Date() > record.expiresAt)
            return { success: false, message: 'OTP has expired. Please request a new one' };
        if (record.otp !== otp)
            return { success: false, message: 'Invalid OTP' };
        await b2bOtp_model_1.B2bOtp.updateOne({ _id: record._id }, { used: true });
        const user = await b2bUser_model_1.B2bUser.findOne({ mobileNumber, status: 'Active' });
        if (!user)
            return { success: false, message: 'No active B2B user found' };
        const token = (0, jwt_1.generateToken)(user._id.toString());
        return { success: true, message: 'Login successful', data: { token, user } };
    },
};
