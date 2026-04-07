"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hubStaffService = void 0;
const staff_model_1 = require("../../models/admin/staff.model");
const shipment_model_1 = require("../../models/shipment/shipment.model");
const hub_model_1 = require("../../models/hub/hub.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
// Helper: resolve hubId from hub direct or hub staff
const resolveHubId = async (userId) => {
    const staff = await staff_model_1.Staff.findById(userId).select('hubId type');
    if (staff && staff.type === 'hub' && staff.hubId) {
        return staff.hubId.toString();
    }
    const hub = await hub_model_1.HubModel.findById(userId);
    if (hub) {
        return hub._id.toString();
    }
    return null;
};
exports.hubStaffService = {
    // Get staff profile with delivery stats
    async getProfile(staffId) {
        try {
            const staff = await staff_model_1.Staff.findById(staffId)
                .populate('hubId', 'hubName city pincode address state phoneNo');
            if (!staff || staff.type !== 'hub') {
                return { success: false, message: 'Hub staff not found' };
            }
            const hubId = staff.hubId ? staff.hubId._id.toString() : null;
            // Delivery stats
            const totalDeliveries = hubId
                ? await shipment_model_1.Shipment.countDocuments({ assignedHubId: hubId, status: 'delivered' })
                : 0;
            const totalOrders = hubId
                ? await shipment_model_1.Shipment.countDocuments({ assignedHubId: hubId })
                : 0;
            return {
                success: true,
                data: {
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    phone: staff.phone,
                    type: staff.type,
                    status: staff.status,
                    hubId: staff.hubId,
                    username: staff.username,
                    totalDeliveries,
                    totalOrders,
                    createdAt: staff.createdAt,
                    updatedAt: staff.updatedAt,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to get profile' };
        }
    },
    // My Tasks - active/in-progress orders assigned to this hub
    async getMyTasks(staffId, page = 1, limit = 10) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const skip = (page - 1) * limit;
            const query = {
                assignedHubId: hubId,
                assignedStaffId: staffId,
                status: { $in: ['Active', 'in_transit', 'created', 'pending'] },
            };
            const orders = await shipment_model_1.Shipment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            const total = await shipment_model_1.Shipment.countDocuments(query);
            return {
                success: true,
                data: orders.map((o) => ({
                    orderId: o.orderId,
                    bookingId: o.order,
                    status: o.status,
                    assignedStaffId: o.assignedStaffId || null,
                    consignee: {
                        name: o.name,
                        phone: o.phone,
                        address: o.add,
                        city: o.city,
                        state: o.state,
                        pin: o.pin,
                    },
                    from: {
                        name: o.fromName,
                        phone: o.fromPhone,
                        address: o.fromAdd,
                        city: o.fromCity,
                        state: o.fromState,
                        pin: o.fromPin,
                    },
                    shippingMode: o.shippingMode,
                    paymentMode: o.paymentMode,
                    createdAt: o.createdAt,
                })),
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to get tasks' };
        }
    },
    // Delivery History - completed orders
    async getDeliveryHistory(staffId, page = 1, limit = 10) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const skip = (page - 1) * limit;
            const query = {
                assignedHubId: hubId,
                assignedStaffId: staffId,
                status: { $in: ['delivered', 'cancelled', 'failed'] },
            };
            const orders = await shipment_model_1.Shipment.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            const total = await shipment_model_1.Shipment.countDocuments(query);
            return {
                success: true,
                data: orders.map((o) => ({
                    orderId: o.orderId,
                    bookingId: o.order,
                    status: o.status,
                    assignedStaffId: o.assignedStaffId || null,
                    consignee: {
                        name: o.name,
                        phone: o.phone,
                        address: o.add,
                        city: o.city,
                        state: o.state,
                        pin: o.pin,
                    },
                    from: {
                        name: o.fromName,
                        phone: o.fromPhone,
                        address: o.fromAdd,
                        city: o.fromCity,
                        state: o.fromState,
                        pin: o.fromPin,
                    },
                    shippingMode: o.shippingMode,
                    paymentMode: o.paymentMode,
                    createdAt: o.createdAt,
                    updatedAt: o.updatedAt,
                })),
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to get delivery history' };
        }
    },
    // Booking Detail - full order detail with charges
    async getBookingDetail(staffId, orderId) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const order = await shipment_model_1.Shipment.findOne({ orderId, assignedHubId: hubId }).lean();
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            // Charge breakdown
            const amount = parseFloat(order.paymentMode === 'COD'
                ? (parseFloat(order.codAmount || '0') > 0 ? order.codAmount : order.totalAmount || '0')
                : (order.totalAmount || '0'));
            const deliveryCharge = amount;
            const totalAmount = deliveryCharge;
            return {
                success: true,
                data: {
                    orderId: order.orderId,
                    bookingId: order.order,
                    waybill: order.waybill,
                    status: order.status,
                    trackingUrl: order.trackingUrl,
                    // Address Details
                    pickup: {
                        name: order.fromName,
                        address: order.fromAdd,
                        city: order.fromCity,
                        state: order.fromState,
                        pin: order.fromPin,
                        phone: order.fromPhone,
                    },
                    delivery: {
                        name: order.name,
                        address: order.add,
                        city: order.city,
                        state: order.state,
                        pin: order.pin,
                        phone: order.phone,
                    },
                    // Package Details
                    package: {
                        productsDesc: order.productsDesc,
                        weight: order.weight,
                        dimensions: {
                            width: order.shipmentWidth,
                            height: order.shipmentHeight,
                            length: order.shipmentLength,
                        },
                        quantity: order.quantity,
                        hsnCode: order.hsnCode,
                    },
                    // Delivery Type
                    deliveryType: {
                        shippingMode: order.shippingMode,
                        paymentMode: order.paymentMode,
                    },
                    // Charges
                    charges: {
                        deliveryCharge,
                        totalAmount,
                    },
                    pickupLocation: order.pickupLocation,
                    assignedStaffId: order.assignedStaffId || null,
                    delhiveryResponse: order.delhiveryResponse || null,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to get booking detail' };
        }
    },
    // Update order status (confirm pickup/delivery)
    async updateOrderStatus(staffId, orderId, status) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const validStatuses = ['Active', 'in_transit', 'delivered', 'failed'];
            if (!validStatuses.includes(status)) {
                return { success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` };
            }
            const order = await shipment_model_1.Shipment.findOne({ orderId, assignedHubId: hubId });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            if (order.status === 'delivered') {
                return { success: false, message: 'Cannot update delivered order' };
            }
            if (order.status === 'cancelled') {
                return { success: false, message: 'Cannot update cancelled order' };
            }
            order.status = status;
            await order.save();
            return {
                success: true,
                message: `Order status updated to ${status}`,
                data: {
                    orderId: order.orderId,
                    waybill: order.waybill || null,
                    trackingUrl: order.trackingUrl || null,
                    status: order.status,
                    delhiveryResponse: order.delhiveryResponse || null,
                    updatedAt: order.updatedAt,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to update order status' };
        }
    },
    // Update AWB number and tracking URL (after placing order directly in Delhivery)
    async updateAwb(staffId, orderId, waybill, trackingUrl) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const order = await shipment_model_1.Shipment.findOne({ orderId, assignedHubId: hubId });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            order.waybill = waybill;
            order.trackingUrl = trackingUrl || `https://www.delhivery.com/track/package/${waybill}`;
            await order.save();
            return {
                success: true,
                message: 'AWB and tracking URL updated',
                data: {
                    orderId: order.orderId,
                    waybill: order.waybill,
                    trackingUrl: order.trackingUrl,
                    status: order.status,
                    updatedAt: order.updatedAt,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to update AWB' };
        }
    },
    // Place order in Delhivery — separate API to get AWB + tracking URL
    async placeDelhiveryOrder(staffId, orderId) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const order = await shipment_model_1.Shipment.findOne({ orderId, assignedHubId: hubId });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            if (order.waybill) {
                return {
                    success: true,
                    message: 'Order already placed in Delhivery',
                    data: {
                        orderId: order.orderId,
                        waybill: order.waybill,
                        trackingUrl: order.trackingUrl,
                        status: order.status,
                    },
                };
            }
            const delhiveryUrl = process.env.DELHIVERY_API_URL ||
                process.env.DELHIVERY_API_BASE_URL ||
                'https://track.delhivery.com';
            const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || '').trim();
            if (!delhiveryToken) {
                return { success: false, message: 'Delhivery API token not configured' };
            }
            // Fill missing pickup fields from hub table
            const pickupRaw = order.pickupLocation || {};
            let hubData = {};
            if (!pickupRaw.city || !pickupRaw.state || !pickupRaw.phone) {
                hubData = await hub_model_1.HubModel.findById(order.assignedHubId).lean() || {};
            }
            const pickup = {
                name: pickupRaw.name || hubData.hubName || '',
                address: pickupRaw.address || hubData.address || '',
                pincode: pickupRaw.pincode || hubData.pincode || '',
                city: pickupRaw.city || hubData.city || '',
                state: pickupRaw.state || hubData.state || '',
                phone: pickupRaw.phone || (hubData.phoneNo ? String(hubData.phoneNo) : ''),
            };
            const delhiveryPayload = {
                shipments: [
                    {
                        name: order.name,
                        add: order.add,
                        pin: order.pin,
                        city: order.city,
                        state: order.state,
                        country: order.country || 'India',
                        phone: order.phone,
                        order: order.order,
                        payment_mode: order.paymentMode,
                        return_pin: order.returnPin || String(pickup.pincode || ''),
                        return_city: order.returnCity || pickup.city || '',
                        return_phone: order.returnPhone || pickup.phone || '',
                        return_add: order.returnAdd || pickup.address || '',
                        return_state: order.returnState || pickup.state || '',
                        return_country: order.returnCountry || 'India',
                        products_desc: order.productsDesc || '',
                        hsn_code: order.hsnCode || '',
                        cod_amount: order.paymentMode === 'COD' ? (order.codAmount || order.totalAmount || '0') : '0',
                        order_date: order.orderDate
                            ? new Date(order.orderDate).toISOString().slice(0, 10)
                            : new Date().toISOString().slice(0, 10),
                        total_amount: order.totalAmount || '0',
                        seller_add: order.sellerAdd || pickup.address || '',
                        seller_name: order.sellerName || pickup.name || '',
                        seller_inv: order.sellerInv || '',
                        quantity: order.quantity || '1',
                        waybill: '',
                        shipment_width: order.shipmentWidth || '10',
                        shipment_height: order.shipmentHeight || '10',
                        shipment_length: order.shipmentLength || '10',
                        weight: order.weight || '0.5',
                        shipping_mode: order.shippingMode || 'Surface',
                        address_type: order.addressType || 'home',
                    },
                ],
                pickup_location: {
                    name: pickup.name || '',
                },
            };
            const response = await axios_1.default.post(`${delhiveryUrl}/api/cmu/create.json`, `format=json&data=${encodeURIComponent(JSON.stringify(delhiveryPayload))}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Token ${delhiveryToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const pkg = response.data?.packages?.[0];
            const isSuccess = pkg?.status === 'Success' && !!pkg?.waybill;
            const isDuplicate = pkg?.remarks?.some((r) => r?.toLowerCase().includes('duplicate')) && !!pkg?.waybill;
            if (isSuccess || isDuplicate) {
                order.waybill = pkg.waybill;
                order.trackingUrl = `https://www.delhivery.com/track/package/${order.waybill}`;
                order.delhiveryResponse = response.data;
                await order.save();
                return {
                    success: true,
                    message: isDuplicate ? 'Order already exists in Delhivery. Waybill updated.' : 'Order placed in Delhivery successfully',
                    data: {
                        orderId: order.orderId,
                        waybill: order.waybill,
                        trackingUrl: order.trackingUrl,
                        status: order.status,
                        delhiveryResponse: response.data,
                    },
                };
            }
            else {
                order.delhiveryResponse = response.data;
                await order.save();
                const rmk = response.data?.rmk || '';
                const pkgRemarks = pkg?.remarks?.filter(Boolean)?.join('; ') || '';
                let errorMsg;
                if (rmk.includes('NoneType') && rmk.includes('end_date')) {
                    errorMsg = `Pickup location "${pickup.name}" is not registered in Delhivery.`;
                }
                else if (pkgRemarks) {
                    errorMsg = pkgRemarks;
                }
                else {
                    errorMsg = rmk || 'Delhivery package creation failed';
                }
                return {
                    success: false,
                    message: errorMsg,
                    data: {
                        orderId: order.orderId,
                        status: order.status,
                        delhiveryResponse: response.data,
                    },
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: error?.response?.data?.rmk || error.message || 'Failed to place order in Delhivery',
                data: { delhiveryResponse: error?.response?.data || null },
            };
        }
    },
    // Update staff account settings
    async updateAccountSettings(staffId, data) {
        try {
            const staff = await staff_model_1.Staff.findById(staffId).select('+password');
            if (!staff || staff.type !== 'hub') {
                return { success: false, message: 'Hub staff not found' };
            }
            if (data.name)
                staff.name = data.name;
            if (data.phone)
                staff.phone = data.phone;
            if (data.password) {
                staff.password = await bcryptjs_1.default.hash(data.password, 10);
            }
            await staff.save();
            const staffData = staff.toObject();
            delete staffData.password;
            return { success: true, message: 'Account updated successfully', data: staffData };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to update account' };
        }
    },
    // Edit order details (verify & correct by staff)
    async editOrder(staffId, orderId, updateData) {
        try {
            const hubId = await resolveHubId(staffId);
            if (!hubId) {
                return { success: false, message: 'Hub access required' };
            }
            const order = await shipment_model_1.Shipment.findOne({ orderId, assignedHubId: hubId });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            if (order.status === 'delivered') {
                return { success: false, message: 'Cannot edit delivered order' };
            }
            if (order.status === 'cancelled') {
                return { success: false, message: 'Cannot edit cancelled order' };
            }
            // Validate assignedStaffId belongs to the same hub
            if (updateData.assignedStaffId) {
                const assignedStaff = await staff_model_1.Staff.findById(updateData.assignedStaffId).select('hubId type status');
                if (!assignedStaff || assignedStaff.type !== 'hub' || !assignedStaff.hubId || assignedStaff.hubId.toString() !== hubId) {
                    return { success: false, message: 'Assigned staff must belong to the same hub' };
                }
                if (assignedStaff.status !== 'Active') {
                    return { success: false, message: 'Assigned staff must be active' };
                }
            }
            // Validate status if provided
            if (updateData.status) {
                const validStatuses = ['pending', 'Active', 'in_transit', 'delivered', 'failed'];
                if (!validStatuses.includes(updateData.status)) {
                    return { success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` };
                }
            }
            // Store original amounts for comparison
            const originalAmount = parseFloat(order.paymentMode === 'COD'
                ? (parseFloat(order.codAmount || '0') > 0 ? order.codAmount : order.totalAmount || '0')
                : (order.totalAmount || '0'));
            const originalTax = parseFloat((originalAmount * 0.046).toFixed(2));
            const originalTotal = parseFloat((originalAmount + originalTax).toFixed(2));
            // Apply editable fields
            const editableFields = [
                'weight', 'shipmentWidth', 'shipmentHeight', 'shipmentLength', 'quantity',
                'productsDesc', 'codAmount', 'totalAmount',
                'name', 'add', 'pin', 'city', 'state', 'phone',
                'paymentMode', 'shippingMode', 'assignedStaffId', 'status',
            ];
            for (const field of editableFields) {
                if (updateData[field] !== undefined && updateData[field] !== '') {
                    order[field] = updateData[field];
                }
            }
            await order.save();
            // Recalculate charges after edit
            const newAmount = parseFloat(order.paymentMode === 'COD'
                ? (parseFloat(order.codAmount || '0') > 0 ? order.codAmount : order.totalAmount || '0')
                : (order.totalAmount || '0'));
            const newTax = parseFloat((newAmount * 0.046).toFixed(2));
            const newTotal = parseFloat((newAmount + newTax).toFixed(2));
            const extraAmount = parseFloat((newTotal - originalTotal).toFixed(2));
            return {
                success: true,
                message: 'Order updated successfully',
                data: {
                    orderId: order.orderId,
                    status: order.status,
                    // Updated package details
                    package: {
                        productsDesc: order.productsDesc,
                        weight: order.weight,
                        dimensions: {
                            width: order.shipmentWidth,
                            height: order.shipmentHeight,
                            length: order.shipmentLength,
                        },
                        quantity: order.quantity,
                    },
                    // Updated delivery details
                    delivery: {
                        name: order.name,
                        address: order.add,
                        city: order.city,
                        state: order.state,
                        pin: order.pin,
                        phone: order.phone,
                    },
                    deliveryType: {
                        shippingMode: order.shippingMode,
                        paymentMode: order.paymentMode,
                    },
                    // Charges comparison
                    originalCharges: {
                        deliveryCharge: originalAmount,
                        tax: originalTax,
                        totalAmount: originalTotal,
                    },
                    updatedCharges: {
                        deliveryCharge: newAmount,
                        tax: newTax,
                        totalAmount: newTotal,
                    },
                    extraAmount,
                    assignedStaffId: order.assignedStaffId || null,
                    updatedAt: order.updatedAt,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Failed to edit order' };
        }
    },
};
