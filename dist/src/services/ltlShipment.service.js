"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ltlShipmentService = void 0;
const axios_1 = __importDefault(require("axios"));
const ltlShipment_model_1 = require("../models/shipment/ltlShipment.model");
const shipment_model_1 = require("../models/shipment/shipment.model");
const hub_model_1 = require("../models/hub/hub.model");
const agency_model_1 = require("../models/admin/agency.model");
const mongoose_1 = require("mongoose");
const markup_model_1 = require("../models/markup/markup.model");
// Find nearest hub based on pincode → city → state → any active hub
async function findNearestHub(pin, city, state) {
    let hub = await hub_model_1.HubModel.findOne({ pincode: parseInt(pin), status: true });
    if (hub)
        return hub;
    hub = await hub_model_1.HubModel.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: true });
    if (hub)
        return hub;
    hub = await hub_model_1.HubModel.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: true });
    if (hub)
        return hub;
    hub = await hub_model_1.HubModel.findOne({ status: true });
    return hub;
}
// Find nearest franchise (Agency) based on pincode → city → state → any active franchise
async function findNearestFranchise(pin, city, state) {
    let franchise = await agency_model_1.Agency.findOne({ pincode: pin, status: 'Active' });
    if (franchise)
        return franchise;
    franchise = await agency_model_1.Agency.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: 'Active' });
    if (franchise)
        return franchise;
    franchise = await agency_model_1.Agency.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: 'Active' });
    if (franchise)
        return franchise;
    franchise = await agency_model_1.Agency.findOne({ status: 'Active' });
    return franchise;
}
// Find nearest hub or franchise — returns both the entity and its type
async function findNearestAssignment(pin, city, state) {
    // Priority 1: Exact pincode match (hub first, then franchise)
    const hubByPin = await hub_model_1.HubModel.findOne({ pincode: parseInt(pin), status: true });
    if (hubByPin)
        return { type: 'hub', hub: hubByPin };
    const franchiseByPin = await agency_model_1.Agency.findOne({ pincode: pin, status: 'Active' });
    if (franchiseByPin)
        return { type: 'franchise', franchise: franchiseByPin };
    // Priority 2: Same city
    const hubByCity = await hub_model_1.HubModel.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: true });
    if (hubByCity)
        return { type: 'hub', hub: hubByCity };
    const franchiseByCity = await agency_model_1.Agency.findOne({ city: { $regex: new RegExp(`^${city}$`, 'i') }, status: 'Active' });
    if (franchiseByCity)
        return { type: 'franchise', franchise: franchiseByCity };
    // Priority 3: Same state
    const hubByState = await hub_model_1.HubModel.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: true });
    if (hubByState)
        return { type: 'hub', hub: hubByState };
    const franchiseByState = await agency_model_1.Agency.findOne({ state: { $regex: new RegExp(`^${state}$`, 'i') }, status: 'Active' });
    if (franchiseByState)
        return { type: 'franchise', franchise: franchiseByState };
    // Priority 4: Any active hub or franchise
    const anyHub = await hub_model_1.HubModel.findOne({ status: true });
    if (anyHub)
        return { type: 'hub', hub: anyHub };
    const anyFranchise = await agency_model_1.Agency.findOne({ status: 'Active' });
    if (anyFranchise)
        return { type: 'franchise', franchise: anyFranchise };
    return null;
}
exports.ltlShipmentService = {
    async createShipment(data) {
        try {
            const { userId, ...shipmentData } = data;
            // Generate unique order ID
            const orderId = `LTL_${userId}_${Date.now()}`;
            // Calculate total amount from invoices if not provided
            let computedTotalAmount = shipmentData.totalAmount || 0;
            if (!computedTotalAmount && shipmentData.invoices && shipmentData.invoices.length > 0) {
                computedTotalAmount = shipmentData.invoices.reduce((sum, inv) => sum + inv.inv_amt, 0);
            }
            // COD validation
            if (shipmentData.payment_mode === 'cod') {
                if (!shipmentData.cod_amount || shipmentData.cod_amount <= 0) {
                    return {
                        success: false,
                        message: 'COD amount is required for COD orders',
                    };
                }
            }
            // Auto-assign nearest hub or franchise
            const dropoff = shipmentData.dropoff_location;
            const assignment = await findNearestAssignment(dropoff.zip, dropoff.city, dropoff.state);
            let assignedTo;
            let assignedHubId;
            let assignedFranchiseId;
            let assignedDetails = null;
            if (assignment) {
                assignedTo = assignment.type;
                if (assignment.type === 'hub' && assignment.hub) {
                    assignedHubId = assignment.hub._id.toString();
                    assignedDetails = {
                        type: 'hub',
                        id: assignment.hub._id.toString(),
                        name: assignment.hub.hubName,
                        managerName: assignment.hub.hubManagerName,
                        phone: assignment.hub.phoneNo,
                        address: assignment.hub.address,
                        city: assignment.hub.city,
                        state: assignment.hub.state,
                        pincode: assignment.hub.pincode,
                    };
                }
                else if (assignment.type === 'franchise' && assignment.franchise) {
                    assignedFranchiseId = assignment.franchise._id.toString();
                    assignedDetails = {
                        type: 'franchise',
                        id: assignment.franchise._id.toString(),
                        name: assignment.franchise.agencyName,
                        ownerName: assignment.franchise.agencyOwner,
                        phone: assignment.franchise.phone,
                        email: assignment.franchise.email,
                        address: assignment.franchise.address,
                        city: assignment.franchise.city,
                        state: assignment.franchise.state,
                        pincode: assignment.franchise.pincode,
                        gstNumber: assignment.franchise.gstNumber,
                    };
                }
            }
            // Calculate markup
            let baseAmount;
            let markupAmount;
            let markupType;
            let markupValue;
            if (shipmentData.baseAmount !== undefined && shipmentData.markupAmount !== undefined) {
                baseAmount = shipmentData.baseAmount;
                markupAmount = shipmentData.markupAmount;
                markupType = shipmentData.markupType;
                markupValue = shipmentData.markupValue;
            }
            else if (computedTotalAmount > 0) {
                baseAmount = computedTotalAmount;
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
                        addedMarkup = parseFloat(((computedTotalAmount * appliedMarkup.markupValue) / 100).toFixed(2));
                    }
                    else {
                        addedMarkup = appliedMarkup.markupValue;
                    }
                    markupAmount = parseFloat((computedTotalAmount + addedMarkup).toFixed(2));
                }
                else {
                    markupAmount = computedTotalAmount;
                }
            }
            // Create LTL shipment in database
            const shipment = await ltlShipment_model_1.LtlShipment.create({
                userId,
                orderId,
                lrn: shipmentData.lrn,
                pickup_location_name: shipmentData.pickup_location_name,
                payment_mode: shipmentData.payment_mode,
                cod_amount: shipmentData.cod_amount,
                weight: shipmentData.weight,
                dropoff_location: shipmentData.dropoff_location,
                rov_insurance: shipmentData.rov_insurance || false,
                invoices: shipmentData.invoices,
                shipment_details: shipmentData.shipment_details,
                doc_data: shipmentData.doc_data,
                doc_file: shipmentData.doc_file,
                fm_pickup: shipmentData.fm_pickup || false,
                freight_mode: shipmentData.freight_mode,
                billing_address: shipmentData.billing_address,
                orderType: shipmentData.orderType || 'b2b',
                status: shipmentData.orderType === 'hub' ? 'Active' : 'pending',
                baseAmount,
                markupAmount,
                markupType,
                markupValue,
                totalAmount: computedTotalAmount,
                assignedTo,
                assignedHubId,
                assignedFranchiseId,
                assignedStaffId: shipmentData.assignedStaffId,
            });
            // Call Delhivery LTL API
            try {
                const delhiveryResult = await callDelhiveryLtlApi(shipment);
                if (delhiveryResult.success) {
                    shipment.delhiveryResponse = delhiveryResult.data;
                    if (delhiveryResult.data?.lrn) {
                        shipment.lrn = delhiveryResult.data.lrn;
                    }
                    if (delhiveryResult.data?.waybill) {
                        shipment.waybill = delhiveryResult.data.waybill;
                    }
                    await shipment.save();
                }
                else {
                    shipment.delhiveryResponse = { error: delhiveryResult.error };
                    await shipment.save();
                }
            }
            catch (apiError) {
                shipment.delhiveryResponse = { error: apiError.message };
                await shipment.save();
            }
            // Also create in Shipment table so assigned hub/franchise can see in their orders
            try {
                const dropoff = shipmentData.dropoff_location;
                await shipment_model_1.Shipment.create({
                    userId,
                    orderId: shipment.orderId,
                    waybill: shipment.waybill,
                    name: dropoff.consignee_name,
                    add: dropoff.address,
                    pin: dropoff.zip,
                    city: dropoff.city,
                    state: dropoff.state,
                    country: 'India',
                    phone: dropoff.phone,
                    order: shipment.orderId,
                    paymentMode: shipmentData.payment_mode === 'cod' ? 'COD' : 'Prepaid',
                    fromName: shipmentData.billing_address.name,
                    fromAdd: shipmentData.billing_address.address,
                    fromPin: shipmentData.billing_address.pin,
                    fromCity: shipmentData.billing_address.city,
                    fromState: shipmentData.billing_address.state,
                    fromCountry: 'India',
                    fromPhone: shipmentData.billing_address.phone,
                    productsDesc: shipmentData.shipment_details?.[0]?.description || 'LTL Shipment',
                    codAmount: shipmentData.cod_amount ? String(shipmentData.cod_amount) : undefined,
                    totalAmount: computedTotalAmount ? String(computedTotalAmount) : undefined,
                    weight: String(shipmentData.weight),
                    quantity: String(shipmentData.shipment_details?.reduce((sum, s) => sum + s.box_count, 0) || 1),
                    shippingMode: 'Surface',
                    pickupLocation: {
                        name: shipmentData.pickup_location_name,
                    },
                    orderType: shipmentData.orderType || 'b2b',
                    status: shipmentData.orderType === 'hub' ? 'Active' : 'pending',
                    baseAmount,
                    markupAmount,
                    markupType,
                    markupValue,
                    assignedHubId,
                    assignedStaffId: shipmentData.assignedStaffId,
                    delhiveryResponse: shipment.delhiveryResponse,
                    trackingUrl: shipment.trackingUrl,
                });
            }
            catch (shipmentErr) {
                console.error('Failed to create Shipment record for LTL order:', shipmentErr.message);
            }
            return {
                success: true,
                data: {
                    orderId: shipment.orderId,
                    lrn: shipment.lrn,
                    waybill: shipment.waybill,
                    status: shipment.status,
                    orderType: shipment.orderType,
                    baseAmount: shipment.baseAmount,
                    markupAmount: shipment.markupAmount,
                    markupType: shipment.markupType,
                    markupValue: shipment.markupValue,
                    totalAmount: shipment.totalAmount,
                    assignedTo: shipment.assignedTo,
                    assignedHubId: shipment.assignedHubId,
                    assignedFranchiseId: shipment.assignedFranchiseId,
                    assignedDetails,
                    delhiveryResponse: shipment.delhiveryResponse,
                },
            };
        }
        catch (error) {
            throw error;
        }
    },
    async getShipment(orderId, userId, isAdmin, hubId) {
        let shipment;
        if (isAdmin) {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId }).lean();
        }
        else if (hubId) {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId, assignedHubId: hubId }).lean();
        }
        else {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId, userId }).lean();
        }
        if (!shipment) {
            return { success: false, message: 'LTL Shipment not found' };
        }
        // Fetch assigned hub/franchise details
        const assignedDetails = await resolveAssignedDetails(shipment);
        return { success: true, data: { ...shipment, assignedDetails } };
    },
    async getShipments(userId, page, limit, status, isAdmin, hubId) {
        const skip = (page - 1) * limit;
        const filter = {};
        if (!isAdmin) {
            if (hubId) {
                filter.assignedHubId = hubId;
            }
            else {
                filter.userId = userId;
            }
        }
        if (status) {
            filter.status = status;
        }
        const [shipments, total] = await Promise.all([
            ltlShipment_model_1.LtlShipment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            ltlShipment_model_1.LtlShipment.countDocuments(filter),
        ]);
        // Add markupProfit and resolve assigned details
        const shipmentsWithDetails = await Promise.all(shipments.map(async (s) => {
            const assignedDetails = await resolveAssignedDetails(s);
            return {
                ...s,
                markupProfit: (s.markupAmount || 0) - (s.baseAmount || 0),
                assignedDetails,
            };
        }));
        return {
            success: true,
            data: {
                shipments: shipmentsWithDetails,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    },
    async updateShipment(orderId, userId, data, isAdmin, hubId) {
        let shipment;
        if (isAdmin) {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId });
        }
        else if (hubId) {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId, assignedHubId: hubId });
        }
        else {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId, userId });
        }
        if (!shipment) {
            return { success: false, message: 'LTL Shipment not found' };
        }
        // Update allowed fields
        const allowedFields = [
            'pickup_location_name', 'payment_mode', 'cod_amount', 'weight',
            'dropoff_location', 'rov_insurance', 'invoices', 'shipment_details',
            'doc_data', 'doc_file', 'fm_pickup', 'freight_mode', 'billing_address',
            'status', 'baseAmount', 'markupAmount', 'markupType', 'markupValue', 'totalAmount',
        ];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                shipment[field] = data[field];
            }
        }
        await shipment.save();
        return { success: true, data: shipment };
    },
    async deleteShipment(orderId, userId, isAdmin, hubId) {
        let shipment;
        if (isAdmin) {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId });
        }
        else if (hubId) {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId, assignedHubId: hubId });
        }
        else {
            shipment = await ltlShipment_model_1.LtlShipment.findOne({ orderId, userId });
        }
        if (!shipment) {
            return { success: false, message: 'LTL Shipment not found' };
        }
        // Soft delete
        shipment.status = 'cancelled';
        await shipment.save();
        return { success: true, message: 'LTL Shipment cancelled successfully' };
    },
};
// Helper: Resolve assigned hub/franchise full details from a shipment record
async function resolveAssignedDetails(shipment) {
    if (shipment.assignedTo === 'hub' && shipment.assignedHubId) {
        const hub = await hub_model_1.HubModel.findById(shipment.assignedHubId).lean();
        if (hub) {
            return {
                type: 'hub',
                id: hub._id.toString(),
                name: hub.hubName,
                managerName: hub.hubManagerName,
                phone: hub.phoneNo,
                address: hub.address,
                city: hub.city,
                state: hub.state,
                pincode: hub.pincode,
            };
        }
    }
    else if (shipment.assignedTo === 'franchise' && shipment.assignedFranchiseId) {
        const franchise = await agency_model_1.Agency.findById(shipment.assignedFranchiseId).lean();
        if (franchise) {
            return {
                type: 'franchise',
                id: franchise._id.toString(),
                name: franchise.agencyName,
                ownerName: franchise.agencyOwner,
                phone: franchise.phone,
                email: franchise.email,
                address: franchise.address,
                city: franchise.city,
                state: franchise.state,
                pincode: franchise.pincode,
                gstNumber: franchise.gstNumber,
            };
        }
    }
    return null;
}
// Call Delhivery LTL Manifest API
async function callDelhiveryLtlApi(shipment) {
    try {
        const delhiveryLtlUrl = process.env.DELHIVERY_LTL_API_URL || 'https://ltl-clients-api-dev.delhivery.com';
        const delhiveryToken = (process.env.DELHIVERY_LTL_API_TOKEN || process.env.DELHIVERY_API_TOKEN || '').trim();
        if (!delhiveryToken) {
            return { success: false, error: 'Delhivery LTL API token not configured' };
        }
        // Build form data
        const FormData = (await Promise.resolve().then(() => __importStar(require('form-data')))).default;
        const formData = new FormData();
        formData.append('lrn', shipment.lrn || '');
        formData.append('pickup_location_name', shipment.pickup_location_name);
        formData.append('payment_mode', shipment.payment_mode);
        formData.append('cod_amount', String(shipment.cod_amount || 0));
        formData.append('weight', String(shipment.weight));
        formData.append('dropoff_location', JSON.stringify(shipment.dropoff_location));
        formData.append('rov_insurance', String(shipment.rov_insurance));
        formData.append('invoices', JSON.stringify(shipment.invoices || []));
        formData.append('shipment_details', JSON.stringify(shipment.shipment_details));
        formData.append('doc_data', JSON.stringify(shipment.doc_data || []));
        formData.append('fm_pickup', String(shipment.fm_pickup));
        formData.append('freight_mode', shipment.freight_mode);
        formData.append('billing_address', JSON.stringify(shipment.billing_address));
        const response = await axios_1.default.post(`${delhiveryLtlUrl}/manifest`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${delhiveryToken}`,
            },
        });
        return { success: true, data: response.data };
    }
    catch (error) {
        console.error('Delhivery LTL API error:', error?.response?.data || error?.message);
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}
