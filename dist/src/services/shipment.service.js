"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentService = void 0;
const axios_1 = __importDefault(require("axios"));
const shipment_model_1 = require("../models/shipment/shipment.model");
exports.shipmentService = {
    async createShipment(data) {
        try {
            const { userId, ...shipmentData } = data;
            // Generate unique order ID if not provided
            const orderId = `ORD_${userId}_${Date.now()}`;
            // Create shipment in database
            const shipment = await shipment_model_1.Shipment.create({
                userId,
                orderId,
                ...shipmentData,
                country: shipmentData.country || 'India',
                shippingMode: shipmentData.shippingMode || 'Surface',
                shipmentWidth: shipmentData.shipmentWidth || '100',
                shipmentHeight: shipmentData.shipmentHeight || '100',
                status: 'pending',
            });
            // Prepare Delhivery API request
            const delhiveryPayload = {
                shipments: [
                    {
                        name: shipmentData.name,
                        add: shipmentData.add,
                        pin: shipmentData.pin,
                        city: shipmentData.city,
                        state: shipmentData.state,
                        country: shipmentData.country || 'India',
                        phone: shipmentData.phone,
                        order: shipmentData.order,
                        payment_mode: shipmentData.paymentMode,
                        return_pin: shipmentData.returnPin || '',
                        return_city: shipmentData.returnCity || '',
                        return_phone: shipmentData.returnPhone || '',
                        return_add: shipmentData.returnAdd || '',
                        return_state: shipmentData.returnState || '',
                        return_country: shipmentData.returnCountry || '',
                        products_desc: shipmentData.productsDesc || '',
                        hsn_code: shipmentData.hsnCode || '',
                        cod_amount: shipmentData.codAmount || '',
                        order_date: shipmentData.orderDate || null,
                        total_amount: shipmentData.totalAmount || '',
                        seller_add: shipmentData.sellerAdd || '',
                        seller_name: shipmentData.sellerName || '',
                        seller_inv: shipmentData.sellerInv || '',
                        quantity: shipmentData.quantity || '',
                        waybill: shipmentData.waybill || '',
                        shipment_width: shipmentData.shipmentWidth || '100',
                        shipment_height: shipmentData.shipmentHeight || '100',
                        weight: shipmentData.weight || '',
                        shipping_mode: shipmentData.shippingMode || 'Surface',
                        address_type: shipmentData.addressType || '',
                    },
                ],
                pickup_location: shipmentData.pickupLocation,
            };
            // Call Delhivery API
            const delhiveryUrl = process.env.DELHIVERY_API_URL || 'https://staging-express.delhivery.com';
            const delhiveryToken = process.env.DELHIVERY_API_TOKEN;
            if (!delhiveryToken) {
                throw new Error('Delhivery API token not configured');
            }
            const response = await axios_1.default.post(`${delhiveryUrl}/api/cmu/create.json`, `format=json&data=${JSON.stringify(delhiveryPayload)}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Token ${delhiveryToken}`,
                    'Content-Type': 'application/json',
                },
            });
            // Update shipment with Delhivery response
            if (response.data.success) {
                shipment.status = 'created';
                shipment.delhiveryResponse = response.data;
                // Extract waybill if available
                if (response.data.packages && response.data.packages[0]) {
                    shipment.waybill = response.data.packages[0].waybill;
                    shipment.trackingUrl = `${delhiveryUrl}/track/package/${shipment.waybill}`;
                }
            }
            else {
                shipment.status = 'failed';
                shipment.delhiveryResponse = response.data;
            }
            await shipment.save();
            return {
                success: true,
                data: {
                    orderId: shipment.orderId,
                    waybill: shipment.waybill,
                    status: shipment.status,
                    trackingUrl: shipment.trackingUrl,
                    delhiveryResponse: response.data,
                },
            };
        }
        catch (error) {
            console.error('Create shipment error:', error.response?.data || error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to create shipment',
            };
        }
    },
    async getShipment(orderId, userId) {
        try {
            const shipment = await shipment_model_1.Shipment.findOne({ orderId, userId }).lean();
            if (!shipment) {
                return {
                    success: false,
                    message: 'Shipment not found',
                };
            }
            return {
                success: true,
                data: {
                    orderId: shipment.orderId,
                    waybill: shipment.waybill,
                    status: shipment.status,
                    trackingUrl: shipment.trackingUrl,
                    consignee: {
                        name: shipment.name,
                        address: shipment.add,
                        city: shipment.city,
                        state: shipment.state,
                        pin: shipment.pin,
                        phone: shipment.phone,
                    },
                    shipmentDetails: {
                        order: shipment.order,
                        paymentMode: shipment.paymentMode,
                        shippingMode: shipment.shippingMode,
                        weight: shipment.weight,
                        dimensions: {
                            width: shipment.shipmentWidth,
                            height: shipment.shipmentHeight,
                        },
                    },
                    pickupLocation: shipment.pickupLocation,
                    createdAt: shipment.createdAt,
                    updatedAt: shipment.updatedAt,
                },
            };
        }
        catch (error) {
            console.error('Get shipment error:', error);
            return {
                success: false,
                message: 'Failed to fetch shipment',
            };
        }
    },
    async getShipments(userId, page = 1, limit = 20, status) {
        try {
            const query = { userId };
            if (status) {
                query.status = status;
            }
            const skip = (page - 1) * limit;
            const shipments = await shipment_model_1.Shipment.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
            const total = await shipment_model_1.Shipment.countDocuments(query);
            return {
                success: true,
                data: shipments.map((s) => ({
                    orderId: s.orderId,
                    bookingId: s.waybill,
                    status: s.status,
                    consigneeName: s.name,
                    consigneeNumber: s.phone,
                    city: s.city,
                    paymentMode: s.paymentMode,
                    amount: s.paymentMode === 'COD' ? s.codAmount : s.totalAmount,
                    createdAt: s.createdAt,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            console.error('Get shipments error:', error);
            return {
                success: false,
                message: 'Failed to fetch shipments',
            };
        }
    },
    async trackShipment(waybill, userId) {
        try {
            // Find shipment in database
            const shipment = await shipment_model_1.Shipment.findOne({ waybill, userId });
            if (!shipment) {
                return {
                    success: false,
                    message: 'Shipment not found',
                };
            }
            // Call Delhivery tracking API
            const delhiveryUrl = process.env.DELHIVERY_API_URL || 'https://staging-express.delhivery.com';
            const delhiveryToken = process.env.DELHIVERY_API_TOKEN;
            if (!delhiveryToken) {
                throw new Error('Delhivery API token not configured');
            }
            const response = await axios_1.default.get(`${delhiveryUrl}/api/v1/packages/json/?waybill=${waybill}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Token ${delhiveryToken}`,
                },
            });
            return {
                success: true,
                data: {
                    orderId: shipment.orderId,
                    waybill: shipment.waybill,
                    status: shipment.status,
                    tracking: response.data,
                },
            };
        }
        catch (error) {
            console.error('Track shipment error:', error.response?.data || error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to track shipment',
            };
        }
    },
};
