"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentService = void 0;
const axios_1 = __importDefault(require("axios"));
const shipment_model_1 = require("../models/shipment/shipment.model");
const wallet_model_1 = require("../models/wallet/wallet.model");
const transaction_model_1 = require("../models/wallet/transaction.model");
const agency_model_1 = require("../models/admin/agency.model");
const hub_model_1 = require("../models/hub/hub.model");
exports.shipmentService = {
    async createShipment(data) {
        let walletDebited = false;
        let debitAmount = 0;
        let debitUserId = '';
        let debitOrderId = '';
        try {
            const { userId, ...shipmentData } = data;
            // Generate unique order ID if not provided
            const orderId = `ORD_${userId}_${Date.now()}`;
            debitOrderId = orderId;
            // Handle Prepaid payment
            if (shipmentData.paymentMode === 'Prepaid') {
                const amount = parseFloat(shipmentData.totalAmount || '0');
                if (amount <= 0) {
                    console.log('❌ Invalid amount for prepaid order:', amount);
                    return {
                        success: false,
                        message: 'Invalid amount for prepaid order',
                    };
                }
                let wallet = await wallet_model_1.Wallet.findOne({ userId });
                if (!wallet) {
                    wallet = await wallet_model_1.Wallet.create({ userId, balance: 0 });
                }
                if (wallet.balance < amount) {
                    return {
                        success: false,
                        message: 'Insufficient wallet balance',
                        data: {
                            requiredAmount: amount,
                            availableBalance: wallet.balance,
                        },
                    };
                }
                const balanceBefore = wallet.balance;
                wallet.balance -= amount;
                await wallet.save();
                await transaction_model_1.Transaction.create({
                    transactionId: `TXN_DEBIT_${orderId}_${Date.now()}`,
                    userId,
                    orderId,
                    amount,
                    type: 'debit',
                    status: 'completed',
                    description: `Shipment payment deducted - ${orderId}`,
                    paymentMethod: 'wallet',
                    balanceBefore,
                    balanceAfter: wallet.balance,
                    metadata: {
                        source: 'shipment_create',
                    },
                });
                walletDebited = true;
                debitAmount = amount;
                debitUserId = userId;
            }
            // Fetch pickup location details from Hub or Agency if not provided
            if (shipmentData.pickupLocation && (!shipmentData.pickupLocation.address || !shipmentData.pickupLocation.pincode)) {
                // First try to find in Hub collection
                const hub = await hub_model_1.HubModel.findOne({ hubName: shipmentData.pickupLocation.name });
                if (hub) {
                    shipmentData.pickupLocation.address = hub.address;
                    shipmentData.pickupLocation.pincode = hub.pincode.toString();
                }
                else {
                    // If not found in Hub, try to find in Agency collection
                    const agency = await agency_model_1.Agency.findOne({ agencyName: shipmentData.pickupLocation.name });
                    if (agency) {
                        shipmentData.pickupLocation.address = agency.address;
                        shipmentData.pickupLocation.pincode = agency.pincode;
                    }
                }
            }
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
            const delhiveryUrl = process.env.DELHIVERY_API_URL ||
                process.env.DELHIVERY_API_BASE_URL ||
                'https://staging-express.delhivery.com';
            const delhiveryToken = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY;
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
            const isDelhiveryCreated = response.data?.success === true ||
                (Array.isArray(response.data?.packages) && response.data.packages.length > 0);
            if (isDelhiveryCreated) {
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
                await shipment.save();
                throw new Error(response.data?.remarks ||
                    response.data?.message ||
                    response.data?.error ||
                    'Delhivery shipment creation failed');
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
            if (walletDebited && debitAmount > 0 && debitUserId) {
                try {
                    let wallet = await wallet_model_1.Wallet.findOne({ userId: debitUserId });
                    if (!wallet) {
                        wallet = await wallet_model_1.Wallet.create({ userId: debitUserId, balance: 0 });
                    }
                    const balanceBefore = wallet.balance;
                    wallet.balance += debitAmount;
                    await wallet.save();
                    await transaction_model_1.Transaction.create({
                        transactionId: `TXN_REVERSAL_${debitOrderId}_${Date.now()}`,
                        userId: debitUserId,
                        orderId: debitOrderId,
                        amount: debitAmount,
                        type: 'reversal',
                        status: 'completed',
                        description: `Wallet debit reversed for failed shipment - ${debitOrderId}`,
                        paymentMethod: 'wallet',
                        balanceBefore,
                        balanceAfter: wallet.balance,
                        metadata: {
                            source: 'shipment_create_failure',
                        },
                    });
                }
                catch (reversalError) {
                    console.error('Wallet reversal failed after shipment error:', reversalError);
                }
            }
            console.error('Create shipment error:', error.response?.data || error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to create shipment',
            };
        }
    },
    async getShipment(orderId, userId, isAdmin) {
        try {
            // If admin, allow viewing any order. Otherwise, only user's own orders
            const query = { orderId };
            if (!isAdmin) {
                query.userId = userId;
            }
            const shipment = await shipment_model_1.Shipment.findOne(query).lean();
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
                    from: {
                        name: shipment.fromName,
                        address: shipment.fromAdd,
                        city: shipment.fromCity,
                        state: shipment.fromState,
                        pin: shipment.fromPin,
                        country: shipment.fromCountry,
                        phone: shipment.fromPhone,
                    },
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
    async getShipments(userId, page = 1, limit = 20, status, isAdmin, franchiseUserIds) {
        try {
            // If admin, show all franchise orders (not admin's own)
            // Otherwise, filter by logged-in userId
            const query = {};
            if (isAdmin && franchiseUserIds && franchiseUserIds.length > 0) {
                // Admin: show only franchise orders
                query.userId = { $in: franchiseUserIds };
            }
            else {
                // Non-admin: show only their own orders
                query.userId = userId;
            }
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
            // Get unique userIds to fetch franchise names
            const userIds = [...new Set(shipments.map(s => s.userId))];
            const agencies = await agency_model_1.Agency.find({ _id: { $in: userIds } }, 'agencyName');
            const agencyMap = new Map(agencies.map(agency => [agency._id.toString(), agency.agencyName]));
            // Get unique pickup location names to fetch hub and agency details
            const pickupLocationNames = [...new Set(shipments.map(s => s.pickupLocation?.name).filter(Boolean))];
            // Try to find in Hub collection first
            const hubs = await hub_model_1.HubModel.find({ hubName: { $in: pickupLocationNames } }, 'hubName address pincode');
            const hubMap = new Map(hubs.map(hub => [hub.hubName, { address: hub.address, pincode: hub.pincode.toString() }]));
            // Also try to find in Agency collection (for franchise-based pickup locations)
            const agenciesForPickup = await agency_model_1.Agency.find({ agencyName: { $in: pickupLocationNames } }, 'agencyName address pincode');
            const agencyPickupMap = new Map(agenciesForPickup.map(agency => [agency.agencyName, { address: agency.address, pincode: agency.pincode }]));
            return {
                success: true,
                data: shipments.map((s) => {
                    const hubDetails = hubMap.get(s.pickupLocation?.name);
                    const agencyDetails = agencyPickupMap.get(s.pickupLocation?.name);
                    const pickupDetails = hubDetails || agencyDetails;
                    return {
                        orderId: s.orderId,
                        userId: s.userId,
                        franchiseName: agencyMap.get(s.userId) || 'Unknown',
                        waybill: s.waybill,
                        status: s.status,
                        trackingUrl: s.trackingUrl,
                        from: {
                            name: s.fromName,
                            address: s.fromAdd,
                            phone: s.fromPhone,
                            city: s.fromCity,
                            state: s.fromState,
                            pin: s.fromPin,
                            country: s.fromCountry,
                        },
                        consignee: {
                            name: s.name,
                            phone: s.phone,
                            address: s.add,
                            city: s.city,
                            state: s.state,
                            pin: s.pin,
                        },
                        shipmentDetails: {
                            order: s.order,
                            paymentMode: s.paymentMode,
                            shippingMode: s.shippingMode,
                            weight: s.weight,
                        },
                        amount: s.paymentMode === 'COD'
                            ? (s.codAmount || '0')
                            : (s.totalAmount || s.codAmount || '0'),
                        pickupLocation: {
                            name: s.pickupLocation?.name,
                            address: s.pickupLocation?.address || pickupDetails?.address,
                            pincode: s.pickupLocation?.pincode || pickupDetails?.pincode,
                        },
                        createdAt: s.createdAt,
                        updatedAt: s.updatedAt,
                    };
                }),
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
    async trackShipment(waybill, userId, isAdmin) {
        try {
            // If admin, allow tracking any shipment. Otherwise, only user's own shipments
            const query = { waybill };
            if (!isAdmin) {
                query.userId = userId;
            }
            // Find shipment in database
            const shipment = await shipment_model_1.Shipment.findOne(query);
            if (!shipment) {
                return {
                    success: false,
                    message: 'Shipment not found',
                };
            }
            // Call Delhivery tracking API
            const delhiveryUrl = process.env.DELHIVERY_API_URL ||
                process.env.DELHIVERY_API_BASE_URL ||
                'https://staging-express.delhivery.com';
            const delhiveryToken = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY;
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
    async updateShipment(orderId, userId, updateData, isAdmin) {
        try {
            // If admin, allow updating any order. Otherwise, only user's own orders
            const query = { orderId };
            if (!isAdmin) {
                query.userId = userId;
            }
            const shipment = await shipment_model_1.Shipment.findOne(query);
            if (!shipment) {
                return {
                    success: false,
                    message: 'Shipment not found',
                };
            }
            // Prevent updating delivered shipments
            if (shipment.status === 'delivered') {
                return {
                    success: false,
                    message: 'Cannot update delivered shipment',
                };
            }
            // Update only provided fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    shipment[key] = updateData[key];
                }
            });
            await shipment.save();
            return {
                success: true,
                message: 'Shipment updated successfully',
                data: {
                    orderId: shipment.orderId,
                    waybill: shipment.waybill,
                    status: shipment.status,
                    updatedAt: shipment.updatedAt,
                },
            };
        }
        catch (error) {
            console.error('Update shipment error:', error);
            return {
                success: false,
                message: error.message || 'Failed to update shipment',
            };
        }
    },
    async deleteShipment(orderId, userId, isAdmin) {
        try {
            // If admin, allow deleting any order. Otherwise, only user's own orders
            const query = { orderId };
            if (!isAdmin) {
                query.userId = userId;
            }
            const shipment = await shipment_model_1.Shipment.findOne(query);
            if (!shipment) {
                return {
                    success: false,
                    message: 'Shipment not found',
                };
            }
            // Prevent deleting delivered shipments
            if (shipment.status === 'delivered') {
                return {
                    success: false,
                    message: 'Cannot delete delivered shipment',
                };
            }
            // Soft delete by setting status to cancelled
            shipment.status = 'cancelled';
            await shipment.save();
            // If prepaid, refund to wallet
            if (shipment.paymentMode === 'Prepaid' && shipment.totalAmount) {
                const amount = parseFloat(shipment.totalAmount);
                if (amount > 0) {
                    let wallet = await wallet_model_1.Wallet.findOne({ userId });
                    if (!wallet) {
                        wallet = await wallet_model_1.Wallet.create({ userId, balance: 0 });
                    }
                    const balanceBefore = wallet.balance;
                    wallet.balance += amount;
                    await wallet.save();
                    // Create refund transaction
                    const transactionId = `TXN_REFUND_${orderId}_${Date.now()}`;
                    await transaction_model_1.Transaction.create({
                        transactionId,
                        userId,
                        orderId,
                        amount,
                        type: 'refund',
                        status: 'completed',
                        description: `Refund for cancelled shipment - ${orderId}`,
                        paymentMethod: 'wallet',
                        balanceBefore,
                        balanceAfter: wallet.balance,
                    });
                    console.log(`💰 Refund processed: ₹${amount} refunded to wallet`);
                }
            }
            return {
                success: true,
                message: 'Shipment cancelled successfully',
                data: {
                    orderId: shipment.orderId,
                    status: shipment.status,
                    refunded: shipment.paymentMode === 'Prepaid',
                    refundAmount: shipment.totalAmount || '0',
                },
            };
        }
        catch (error) {
            console.error('Delete shipment error:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete shipment',
            };
        }
    },
};
