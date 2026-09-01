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
const appCustomer_model_1 = require("../models/customer/appCustomer.model");
const hub_model_1 = require("../models/hub/hub.model");
const mongoose_1 = require("mongoose");
const markup_model_1 = require("../models/markup/markup.model");
// Helper: Call Delhivery create API for an existing shipment and update it
async function createDelhiveryShipment(shipment) {
    try {
        const delhiveryUrl = process.env.DELHIVERY_API_URL ||
            process.env.DELHIVERY_API_BASE_URL ||
            'https://track.delhivery.com';
        const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();
        if (!delhiveryToken) {
            return { success: false, error: 'Delhivery API token not configured' };
        }
        const delhiveryPayload = {
            shipments: [
                {
                    name: shipment.name,
                    add: shipment.add,
                    pin: shipment.pin,
                    city: shipment.city,
                    state: shipment.state,
                    country: shipment.country || 'India',
                    phone: shipment.phone,
                    order: shipment.order,
                    payment_mode: shipment.paymentMode,
                    return_pin: shipment.returnPin || shipment.pickupLocation?.pincode || '',
                    return_city: shipment.returnCity || shipment.pickupLocation?.city || '',
                    return_phone: shipment.returnPhone || shipment.pickupLocation?.phone || '',
                    return_add: shipment.returnAdd || shipment.pickupLocation?.address || '',
                    return_state: shipment.returnState || shipment.pickupLocation?.state || '',
                    return_country: shipment.returnCountry || 'India',
                    products_desc: shipment.productsDesc || '',
                    hsn_code: shipment.hsnCode || '',
                    cod_amount: shipment.codAmount || '0',
                    order_date: shipment.orderDate
                        ? new Date(shipment.orderDate).toISOString().slice(0, 10)
                        : new Date().toISOString().slice(0, 10),
                    total_amount: shipment.totalAmount || '0',
                    seller_add: shipment.sellerAdd || shipment.pickupLocation?.address || '',
                    seller_name: shipment.sellerName || shipment.pickupLocation?.name || '',
                    seller_inv: shipment.sellerInv || '',
                    quantity: shipment.quantity || '1',
                    waybill: shipment.waybill || '',
                    shipment_width: shipment.shipmentWidth || '10',
                    shipment_height: shipment.shipmentHeight || '10',
                    weight: shipment.weight || '0.5',
                    shipping_mode: shipment.shippingMode || 'Surface',
                    address_type: shipment.addressType || 'home',
                },
            ],
            pickup_location: {
                name: shipment.pickupLocation?.name || '',
            },
        };
        const response = await axios_1.default.post(`${delhiveryUrl}/api/cmu/create.json`, `format=json&data=${encodeURIComponent(JSON.stringify(delhiveryPayload))}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Token ${delhiveryToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const isDelhiveryCreated = response.data?.success === true ||
            (Array.isArray(response.data?.packages) && response.data.packages.length > 0);
        if (isDelhiveryCreated && response.data.packages?.[0]) {
            shipment.waybill = response.data.packages[0].waybill;
            shipment.trackingUrl = `${delhiveryUrl}/track/package/${shipment.waybill}`;
            shipment.delhiveryResponse = response.data;
            await shipment.save();
            return { success: true, data: response.data };
        }
        else {
            shipment.delhiveryResponse = response.data;
            await shipment.save();
            return { success: true, data: response.data };
        }
    }
    catch (error) {
        console.error('Delhivery API error:', error?.response?.data || error?.message);
        shipment.delhiveryResponse = { error: error?.response?.data || error?.message };
        await shipment.save();
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}
// Find nearest hub based on customer pincode → city → state → any active hub
async function findNearestHub(pin, city, state) {
    // 1. Same pincode
    let hub = await hub_model_1.HubModel.findOne({ pincode: parseInt(pin), status: true });
    if (hub)
        return hub;
    // 2. Same city (case-insensitive)
    hub = await hub_model_1.HubModel.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: true });
    if (hub)
        return hub;
    // 3. Same state (case-insensitive)
    hub = await hub_model_1.HubModel.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: true });
    if (hub)
        return hub;
    // 4. Any active hub
    hub = await hub_model_1.HubModel.findOne({ status: true });
    return hub;
}
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
            // For COD orders: use totalAmount as codAmount if codAmount is missing/zero
            if (shipmentData.paymentMode === 'COD') {
                const codAmt = parseFloat(shipmentData.codAmount || '0');
                const totalAmt = parseFloat(shipmentData.totalAmount || '0');
                if (codAmt <= 0 && totalAmt > 0) {
                    shipmentData.codAmount = shipmentData.totalAmount;
                }
                else if (codAmt <= 0 && totalAmt <= 0) {
                    console.log('❌ No valid amount for COD order');
                    return {
                        success: false,
                        message: 'Amount is required for COD orders. Please provide totalAmount or codAmount.',
                    };
                }
            }
            // Handle Prepaid payment
            if (shipmentData.paymentMode === 'Prepaid' && !shipmentData.skipWalletCheck) {
                const amount = parseFloat(shipmentData.totalAmount || '0');
                if (amount <= 0) {
                    console.log('❌ Invalid amount for prepaid order:', amount);
                    return {
                        success: false,
                        message: 'Invalid amount for prepaid order',
                    };
                }
                // Use walletUserId (franchise ID) if provided, otherwise fall back to userId
                const walletOwnerId = shipmentData.walletUserId || userId;
                let wallet = await wallet_model_1.Wallet.findOne({ userId: walletOwnerId });
                if (!wallet) {
                    wallet = await wallet_model_1.Wallet.create({ userId: walletOwnerId, balance: 0 });
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
                    userId: walletOwnerId,
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
                debitUserId = walletOwnerId;
            }
            // Preserve an explicitly provided assignedHubId (e.g. hub-created orders own themselves)
            const providedHubId = shipmentData.assignedHubId;
            // Auto-assign nearest hub if pickupLocation not provided
            if (!shipmentData.pickupLocation || !shipmentData.pickupLocation.name) {
                // Use FROM address (sender) to find nearest hub, not consignee address
                const fromPin = shipmentData.fromPin || shipmentData.pin;
                const fromCity = shipmentData.fromCity || shipmentData.city;
                const fromState = shipmentData.fromState || shipmentData.state;
                const nearestHub = await findNearestHub(fromPin, fromCity, fromState);
                if (nearestHub) {
                    // Pickup location = hub's address after hub assignment
                    shipmentData.pickupLocation = {
                        name: nearestHub.hubName,
                        address: nearestHub.address,
                        pincode: nearestHub.pincode.toString(),
                        city: nearestHub.city,
                        state: nearestHub.state,
                        phone: nearestHub.phoneNo?.toString(),
                    };
                    // Don't clobber an explicitly provided owner hub (hub-created orders)
                    if (!providedHubId) {
                        shipmentData.assignedHubId = nearestHub._id.toString();
                    }
                }
                else {
                    return { success: false, message: 'No active hub available. Please try again later.' };
                }
            }
            // Fetch pickup location details from Hub or Agency if not provided
            if (shipmentData.pickupLocation && (!shipmentData.pickupLocation.address || !shipmentData.pickupLocation.pincode)) {
                // First try to find in Hub collection
                const hub = await hub_model_1.HubModel.findOne({ hubName: shipmentData.pickupLocation.name });
                if (hub) {
                    shipmentData.pickupLocation.address = hub.address;
                    shipmentData.pickupLocation.pincode = hub.pincode.toString();
                    shipmentData.pickupLocation.city = shipmentData.pickupLocation.city || hub.city;
                    shipmentData.pickupLocation.state = shipmentData.pickupLocation.state || hub.state;
                    shipmentData.pickupLocation.phone = shipmentData.pickupLocation.phone || hub.phoneNo?.toString();
                    // Assign hub ID if not already set
                    if (!shipmentData.assignedHubId) {
                        shipmentData.assignedHubId = hub._id.toString();
                    }
                }
                else {
                    // If not found in Hub, try to find in Agency collection
                    const agency = await agency_model_1.Agency.findOne({ agencyName: shipmentData.pickupLocation.name });
                    if (agency) {
                        shipmentData.pickupLocation.address = agency.address;
                        shipmentData.pickupLocation.pincode = agency.pincode;
                        shipmentData.pickupLocation.city = shipmentData.pickupLocation.city || agency.city;
                        shipmentData.pickupLocation.state = shipmentData.pickupLocation.state || agency.state;
                        shipmentData.pickupLocation.phone = shipmentData.pickupLocation.phone || agency.phone;
                    }
                }
            }
            // Calculate markup for all order types (customer and hub)
            let baseAmount;
            let markupAmount;
            let markupType;
            let markupValue;
            // If payload has baseAmount/markupAmount, use them directly (skip auto-calculate)
            const payloadBaseAmount = shipmentData.baseAmount !== undefined ? parseFloat(String(shipmentData.baseAmount)) : NaN;
            const payloadMarkupAmount = shipmentData.markupAmount !== undefined ? parseFloat(String(shipmentData.markupAmount)) : NaN;
            if (!isNaN(payloadBaseAmount) && !isNaN(payloadMarkupAmount)) {
                baseAmount = payloadBaseAmount;
                markupAmount = payloadMarkupAmount;
                markupType = shipmentData.markupType;
                markupValue = shipmentData.markupValue !== undefined ? parseFloat(String(shipmentData.markupValue)) : undefined;
            }
            else {
                const rawAmount = parseFloat(shipmentData.totalAmount || '0');
                if (rawAmount > 0) {
                    baseAmount = rawAmount;
                    // Fetch markup: user-specific > global
                    const markupQueries = [
                        { markupCategory: 'rate_card', userId: new mongoose_1.Types.ObjectId(userId), isActive: true },
                        { markupCategory: 'rate_card', userId: null, franchiseId: null, isActive: true },
                    ];
                    let appliedMarkup = null;
                    for (const q of markupQueries) {
                        appliedMarkup = await markup_model_1.Markup.findOne(q).lean();
                        if (appliedMarkup)
                            break;
                    }
                    if (appliedMarkup) {
                        markupType = appliedMarkup.markupType;
                        markupValue = appliedMarkup.markupValue;
                        let addedMarkup;
                        if (appliedMarkup.markupType === 'percentage') {
                            addedMarkup = parseFloat(((rawAmount * appliedMarkup.markupValue) / 100).toFixed(2));
                        }
                        else {
                            addedMarkup = appliedMarkup.markupValue;
                        }
                        markupAmount = parseFloat((rawAmount + addedMarkup).toFixed(2));
                    }
                    else {
                        markupAmount = rawAmount;
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
                shipmentLength: shipmentData.shipmentLength || '100',
                assignedHubId: shipmentData.assignedHubId || undefined,
                assignedStaffId: shipmentData.assignedStaffId || undefined,
                orderType: shipmentData.orderType || 'customer',
                status: shipmentData.orderType == 'hub' ? 'Active' : 'pending',
                baseAmount,
                markupAmount,
                markupType,
                markupValue,
            });
            // Try Delhivery API to get waybill (optional - order is already created)
            try {
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
                            return_pin: shipmentData.returnPin || shipmentData.pickupLocation.pincode || '',
                            return_city: shipmentData.returnCity || shipmentData.pickupLocation.city || '',
                            return_phone: shipmentData.returnPhone || shipmentData.pickupLocation.phone || '',
                            return_add: shipmentData.returnAdd || shipmentData.pickupLocation.address || '',
                            return_state: shipmentData.returnState || shipmentData.pickupLocation.state || '',
                            return_country: shipmentData.returnCountry || 'India',
                            products_desc: shipmentData.productsDesc || '',
                            hsn_code: shipmentData.hsnCode || '',
                            cod_amount: shipmentData.codAmount || '0',
                            order_date: shipmentData.orderDate
                                ? new Date(shipmentData.orderDate).toISOString().slice(0, 10)
                                : new Date().toISOString().slice(0, 10),
                            total_amount: shipmentData.totalAmount || '0',
                            seller_add: shipmentData.sellerAdd || shipmentData.pickupLocation.address || '',
                            seller_name: shipmentData.sellerName || shipmentData.pickupLocation.name || '',
                            seller_inv: shipmentData.sellerInv || '',
                            quantity: shipmentData.quantity || '1',
                            waybill: shipmentData.waybill || '',
                            shipment_width: shipmentData.shipmentWidth || '10',
                            shipment_height: shipmentData.shipmentHeight || '10',
                            weight: shipmentData.weight || '0.5',
                            shipping_mode: shipmentData.shippingMode || 'Surface',
                            address_type: shipmentData.addressType || 'home',
                        },
                    ],
                    pickup_location: {
                        name: shipmentData.pickupLocation.name,
                    },
                };
                const delhiveryUrl = process.env.DELHIVERY_API_URL ||
                    process.env.DELHIVERY_API_BASE_URL ||
                    'https://track.delhivery.com';
                const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();
                if (delhiveryToken) {
                    const response = await axios_1.default.post(`${delhiveryUrl}/api/cmu/create.json`, `format=json&data=${encodeURIComponent(JSON.stringify(delhiveryPayload))}`, {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Token ${delhiveryToken}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });
                    const isDelhiveryCreated = response.data?.success === true ||
                        (Array.isArray(response.data?.packages) && response.data.packages.length > 0);
                    if (isDelhiveryCreated && response.data.packages?.[0]) {
                        shipment.waybill = response.data.packages[0].waybill;
                        shipment.trackingUrl = `${delhiveryUrl}/track/package/${shipment.waybill}`;
                        shipment.delhiveryResponse = response.data;
                        await shipment.save();
                    }
                    else {
                        shipment.delhiveryResponse = response.data;
                        await shipment.save();
                    }
                }
            }
            catch (delhiveryError) {
                // Delhivery failed but order is already created - just log it
                console.error('Delhivery API error (order still created):', delhiveryError?.response?.data || delhiveryError?.message);
                shipment.delhiveryResponse = { error: delhiveryError?.response?.data || delhiveryError?.message };
                await shipment.save();
            }
            return {
                success: true,
                data: {
                    orderId: shipment.orderId,
                    waybill: shipment.waybill || '',
                    status: shipment.status,
                    trackingUrl: shipment.trackingUrl || '',
                    // Receiver details
                    name: shipment.name,
                    address: shipment.add,
                    city: shipment.city,
                    state: shipment.state,
                    pincode: shipment.pin,
                    phone: shipment.phone,
                    country: shipment.country,
                    // Order details
                    paymentMode: shipment.paymentMode,
                    totalAmount: shipment.totalAmount || '0',
                    codAmount: shipment.codAmount || '0',
                    productsDesc: shipment.productsDesc || '',
                    quantity: shipment.quantity || '1',
                    weight: shipment.weight || '',
                    shippingMode: shipment.shippingMode,
                    dimensions: {
                        width: shipment.shipmentWidth || '100',
                        height: shipment.shipmentHeight || '100',
                        length: shipment.shipmentLength || '100',
                    },
                    // Pickup
                    pickupLocation: shipment.pickupLocation,
                    assignedHubId: shipment.assignedHubId || null,
                    assignedStaffId: shipment.assignedStaffId || null,
                    orderType: shipment.orderType || 'customer',
                    // Markup fields
                    baseAmount: shipment.baseAmount ?? null,
                    markupAmount: shipment.markupAmount ?? null,
                    markupType: shipment.markupType ?? null,
                    markupValue: shipment.markupValue ?? null,
                    // Timestamps
                    createdAt: shipment.createdAt,
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
    async getShipment(orderId, userId, isAdmin, assignedHubId) {
        try {
            // If admin, allow viewing any order. If hub, filter by assignedHubId. Otherwise, only user's own orders
            const query = { orderId };
            if (!isAdmin) {
                if (assignedHubId) {
                    query.assignedHubId = assignedHubId;
                }
                else {
                    query.userId = userId;
                }
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
                            length: shipment.shipmentLength,
                        },
                    },
                    amount: shipment.paymentMode == 'COD'
                        ? (parseFloat(shipment.codAmount || '0') > 0 ? shipment.codAmount : shipment.totalAmount || '0')
                        : (shipment.totalAmount || '0'),
                    totalAmount: shipment.totalAmount || '0',
                    codAmount: shipment.codAmount || '0',
                    productsDesc: shipment.productsDesc || '',
                    quantity: shipment.quantity || '1',
                    sellerName: shipment.sellerName || '',
                    sellerInv: shipment.sellerInv || '',
                    hsnCode: shipment.hsnCode || '',
                    pickupLocation: shipment.pickupLocation,
                    delhiveryResponse: shipment.delhiveryResponse || null,
                    orderType: shipment.orderType || 'customer',
                    baseAmount: shipment.baseAmount ?? (parseFloat(shipment.totalAmount || '0') || null),
                    markupAmount: shipment.markupAmount ?? (parseFloat(shipment.totalAmount || '0') || null),
                    markupType: shipment.markupType ?? null,
                    markupValue: shipment.markupValue ?? null,
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
    async getShipments(userId, page = 1, limit = 20, status, isAdmin, franchiseUserIds, assignedHubId) {
        try {
            // If admin, show all orders (no userId filter needed)
            // Otherwise, filter by logged-in userId or hub
            const query = {};
            if (assignedHubId) {
                // Hub staff: show orders assigned to their hub
                query.assignedHubId = assignedHubId;
            }
            else if (isAdmin) {
                // Admin: show all orders - no userId filter
            }
            else {
                // Non-admin: show only their own orders
                query.userId = userId;
            }
            if (status) {
                query.status = status;
            }
            // No default status filter - show all orders when no status is specified
            const skip = (page - 1) * limit;
            const [shipments, total] = await Promise.all([
                shipment_model_1.Shipment.find(query)
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip(skip)
                    .lean(),
                shipment_model_1.Shipment.countDocuments(query),
            ]);
            // Get unique userIds to fetch franchise/customer names
            const userIds = [...new Set(shipments.map(s => s.userId))];
            // Get unique pickup location names to fetch hub and agency details
            const pickupLocationNames = [...new Set(shipments.map(s => s.pickupLocation?.name).filter(Boolean))];
            // Run all lookups in parallel
            const [agencies, customers, hubs, agenciesForPickup] = await Promise.all([
                agency_model_1.Agency.find({ _id: { $in: userIds } }, 'agencyName').lean(),
                appCustomer_model_1.AppCustomer.find({ _id: { $in: userIds } }, 'firstName lastName').lean(),
                hub_model_1.HubModel.find({ hubName: { $in: pickupLocationNames } }, 'hubName address pincode').lean(),
                agency_model_1.Agency.find({ agencyName: { $in: pickupLocationNames } }, 'agencyName address pincode').lean(),
            ]);
            const agencyMap = new Map(agencies.map(agency => [agency._id.toString(), agency.agencyName]));
            const customerMap = new Map(customers.map(c => [c._id.toString(), `${c.firstName} ${c.lastName}`.trim()]));
            const hubMap = new Map(hubs.map(hub => [hub.hubName, { address: hub.address, pincode: hub.pincode.toString() }]));
            const agencyPickupMap = new Map(agenciesForPickup.map(agency => [agency.agencyName, { address: agency.address, pincode: agency.pincode }]));
            return {
                success: true,
                data: shipments.map((s) => {
                    const hubDetails = hubMap.get(s.pickupLocation?.name);
                    const agencyDetails = agencyPickupMap.get(s.pickupLocation?.name);
                    const pickupDetails = hubDetails || agencyDetails;
                    const baseAmount = s.baseAmount ?? (parseFloat(s.totalAmount || '0') || null);
                    const markupAmount = s.markupAmount ?? (parseFloat(s.totalAmount || '0') || null);
                    const markupProfit = markupAmount !== null && baseAmount !== null
                        ? parseFloat((markupAmount - baseAmount).toFixed(2))
                        : null;
                    return {
                        orderId: s.orderId,
                        userId: s.userId,
                        franchiseName: agencyMap.get(s.userId) || customerMap.get(s.userId) || 'Unknown',
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
                            dimensions: {
                                width: s.shipmentWidth || '100',
                                height: s.shipmentHeight || '100',
                                length: s.shipmentLength || '100',
                            },
                            weight: s.weight,
                        },
                        amount: s.paymentMode === 'COD'
                            ? (parseFloat(s.codAmount || '0') > 0 ? s.codAmount : s.totalAmount || '0')
                            : (parseFloat(s.totalAmount || '0') > 0 ? s.totalAmount : s.codAmount || '0'),
                        pickupLocation: {
                            name: s.pickupLocation?.name,
                            address: s.pickupLocation?.address || pickupDetails?.address,
                            pincode: s.pickupLocation?.pincode || pickupDetails?.pincode,
                        },
                        assignedStaffId: s.assignedStaffId || null,
                        orderType: s.orderType || 'customer',
                        delhiveryResponse: s.delhiveryResponse || null,
                        baseAmount,
                        markupAmount,
                        markupProfit,
                        markupType: s.markupType ?? null,
                        markupValue: s.markupValue ?? null,
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
                'https://track.delhivery.com';
            const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();
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
            const previousStatus = shipment.status;
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    shipment[key] = updateData[key];
                }
            });
            // Recalculate markup if totalAmount is being updated
            if (updateData.totalAmount !== undefined) {
                const rawAmount = parseFloat(updateData.totalAmount || '0');
                if (rawAmount > 0) {
                    shipment.baseAmount = rawAmount;
                    const markupQueries = [
                        { markupCategory: 'rate_card', userId: new mongoose_1.Types.ObjectId(shipment.userId), isActive: true },
                        { markupCategory: 'rate_card', userId: null, franchiseId: null, isActive: true },
                    ];
                    let appliedMarkup = null;
                    for (const q of markupQueries) {
                        appliedMarkup = await markup_model_1.Markup.findOne(q).lean();
                        if (appliedMarkup)
                            break;
                    }
                    if (appliedMarkup) {
                        shipment.markupType = appliedMarkup.markupType;
                        shipment.markupValue = appliedMarkup.markupValue;
                        let addedMarkup;
                        if (appliedMarkup.markupType === 'percentage') {
                            addedMarkup = parseFloat(((rawAmount * appliedMarkup.markupValue) / 100).toFixed(2));
                        }
                        else {
                            addedMarkup = appliedMarkup.markupValue;
                        }
                        shipment.markupAmount = parseFloat((rawAmount + addedMarkup).toFixed(2));
                    }
                    else {
                        shipment.markupAmount = rawAmount;
                        shipment.markupType = undefined;
                        shipment.markupValue = undefined;
                    }
                }
            }
            await shipment.save();
            // If status changed to Active (confirmed) and no waybill yet, call Delhivery create API
            if (shipment.status === 'Active' && previousStatus !== 'Active' && !shipment.waybill) {
                await createDelhiveryShipment(shipment);
            }
            return {
                success: true,
                message: 'Shipment updated successfully',
                data: {
                    orderId: shipment.orderId,
                    waybill: shipment.waybill,
                    status: shipment.status,
                    trackingUrl: shipment.trackingUrl,
                    delhiveryResponse: shipment.delhiveryResponse || null,
                    baseAmount: shipment.baseAmount ?? null,
                    markupAmount: shipment.markupAmount ?? null,
                    markupType: shipment.markupType ?? null,
                    markupValue: shipment.markupValue ?? null,
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
