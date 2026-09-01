"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parcelOrderService = exports.ParcelOrderService = void 0;
const parcelOrder_model_1 = require("../../models/admin/parcelOrder.model");
const agency_model_1 = require("../../models/admin/agency.model");
const hub_model_1 = require("../../models/hub/hub.model");
const vehicle_model_1 = require("../../models/admin/vehicle.model");
const driver_model_1 = require("../../models/admin/driver.model");
const parcelSettlement_service_1 = require("./parcelSettlement.service");
const invoice_service_1 = require("./invoice.service");
const walletLedger_1 = require("../../utils/walletLedger");
const parcelCharges_1 = require("../../utils/parcelCharges");
const mongoose_1 = require("mongoose");
const AGENCY_SELECT = 'agencyName agencyOwner phone city state pincode status type profitPercentage';
const POPULATE = [
    { path: 'agency', select: AGENCY_SELECT },
    { path: 'deliveryCustomer.deliveryAgency', select: AGENCY_SELECT },
    { path: 'hub', select: 'hubName hubManagerName phoneNo city state pincode status' },
    { path: 'vehicle', select: 'vehicleType vehicleRegistrationNumber capacity status' },
    { path: 'driver', select: 'driverName phoneNumber licenseNumber status' },
];
/** Read the agency id from either the current or the deprecated key */
const pickAgencyId = (data) => data?.agency || data?.branch;
const pickDeliveryAgencyId = (customer) => customer?.deliveryAgency || customer?.deliveryBranch;
class ParcelOrderService {
    /** A running number as three groups of three digits: 3611380 -> 003-611-380 */
    formatOrderNumber(seq) {
        const digits = String(seq).padStart(9, '0').slice(-9);
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    // Generate a unique, readable order number
    async generateOrderNumber() {
        const count = await parcelOrder_model_1.ParcelOrder.countDocuments();
        let seq = count + 1;
        // Ensure uniqueness even if older records were deleted
        let orderNumber = this.formatOrderNumber(seq);
        while (await parcelOrder_model_1.ParcelOrder.exists({ orderNumber })) {
            seq += 1;
            orderNumber = this.formatOrderNumber(seq);
        }
        return orderNumber;
    }
    /** Is this agency actor the order's booking (origin) agency? */
    isOriginAgency(order, actor) {
        const origin = order.agency;
        const originId = origin?._id ? origin._id.toString() : origin?.toString();
        return originId === actor.agencyId;
    }
    /** Is this agency actor the order's delivery (destination) agency? */
    isDestinationAgency(order, actor) {
        const dest = order.deliveryCustomer?.deliveryAgency;
        // Populated documents expose _id; raw ones are plain ObjectIds
        const destId = dest?._id ? dest._id.toString() : dest?.toString();
        return destId === actor.agencyId;
    }
    /**
     * An agency may only touch orders it books or receives; a hub only orders
     * routed to it. Admin sees everything.
     */
    assertScope(order, actor) {
        if (actor.role === 'admin')
            return null;
        if (actor.role === 'agency') {
            if (!this.isOriginAgency(order, actor) && !this.isDestinationAgency(order, actor)) {
                return {
                    success: false,
                    code: 403,
                    message: 'This parcel order was neither booked at nor addressed to your agency',
                };
            }
            return null;
        }
        // hub
        if (!order.hub || order.hub.toString() !== actor.hubId) {
            return {
                success: false,
                code: 403,
                message: 'This parcel order is not assigned to your hub',
            };
        }
        return null;
    }
    /** Resolve + validate an Agency id used as origin or destination */
    async resolveAgency(agencyId, label) {
        if (!agencyId || !mongoose_1.Types.ObjectId.isValid(agencyId)) {
            return { error: { success: false, message: `Invalid ${label} ID` } };
        }
        const agency = await agency_model_1.Agency.findById(agencyId);
        if (!agency) {
            return { error: { success: false, message: `${label} not found` } };
        }
        if (agency.status !== 'Active') {
            return { error: { success: false, message: `Selected ${label} is inactive` } };
        }
        return { agency };
    }
    // 2.3 Create parcel order (booked by an agency, or by admin on an agency's behalf)
    async createParcelOrder(data, actor) {
        try {
            if (actor.role === 'hub') {
                return {
                    success: false,
                    code: 403,
                    message: 'A hub cannot book parcel orders',
                };
            }
            // An agency always books for itself; admin must state the agency explicitly.
            const agencyId = actor.role === 'agency' ? actor.agencyId : pickAgencyId(data);
            if (!agencyId) {
                return { success: false, message: 'Agency is required' };
            }
            const origin = await this.resolveAgency(agencyId, 'Agency');
            if (origin.error)
                return origin.error;
            const agency = origin.agency;
            // Destination agency is chosen from the available-agencies dropdown. It
            // is optional — a booking can be taken before the delivering agency is
            // known and the agency set later from the update endpoint.
            const destinationId = pickDeliveryAgencyId(data.deliveryCustomer);
            const destination = destinationId
                ? await this.resolveAgency(destinationId, 'Delivery agency')
                : {};
            if (destination.error)
                return destination.error;
            const destinationAgency = destination.agency;
            // Loading + miscellaneous are derived from the transportation charge
            const charges = (0, parcelCharges_1.calculateCharges)(data.transportationCharge ?? 0, agency, {
                loadingCharge: data.loadingCharge,
                miscellaneousCharge: data.miscellaneousCharge,
            });
            const orderNumber = await this.generateOrderNumber();
            const { deliveryAgency, deliveryBranch, ...deliveryRest } = data.deliveryCustomer;
            const order = new parcelOrder_model_1.ParcelOrder({
                orderNumber,
                agency: agency._id,
                bookingCustomer: data.bookingCustomer,
                paymentType: data.paymentType,
                deliveryCustomer: {
                    ...deliveryRest,
                    deliveryAgency: destinationAgency?._id,
                },
                pickupAddress: data.pickupAddress,
                deliveryAddress: data.deliveryAddress,
                parcelDetails: data.parcelDetails,
                waybill: data.waybill,
                vehicleType: data.vehicleType,
                vehicleCapacity: data.vehicleCapacity,
                ...charges,
                vehicle: data.vehicle || undefined,
                driver: data.driver || undefined,
                status: 'Order Created',
                statusHistory: [
                    {
                        status: 'Order Created',
                        note: destinationAgency
                            ? `Order booked at "${agency.agencyName}" for delivery at "${destinationAgency.agencyName}"`
                            : `Order booked at "${agency.agencyName}"; delivery agency not set yet`,
                        updatedBy: actor.id,
                        updatedByRole: actor.role,
                        updatedByName: actor.name,
                        updatedAt: new Date(),
                    },
                ],
            });
            await order.save();
            // Money side of the booking: the admin's share of the total leaves the
            // agency wallet right away. If the agency cannot cover it the booking is
            // rolled back, so an order never exists without its settlement.
            const settlement = await parcelSettlement_service_1.parcelSettlementService.settleOrder(order, actor, {
                agency,
            });
            if (!settlement.success) {
                await parcelOrder_model_1.ParcelOrder.findByIdAndDelete(order._id);
                return {
                    success: false,
                    code: settlement.code || 400,
                    message: settlement.message,
                    data: settlement.data,
                };
            }
            // Every booking gets an invoice. A failure here does not undo the booking
            // — the invoice can be raised again from the generate endpoint — but it
            // must not pass silently, or the order simply has no invoice to show.
            const invoice = await invoice_service_1.invoiceService.createForOrder(order, actor, {
                agency,
                deliveryAgency: destinationAgency,
            });
            if (!invoice.success) {
                console.error(`Invoice not raised for parcel order ${order.orderNumber}: ${invoice.message}`);
            }
            const populated = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
            return {
                success: true,
                message: `Parcel order created successfully. ${settlement.message}${invoice.success ? '' : ` Invoice not raised: ${invoice.message}`}`,
                data: {
                    ...(0, parcelOrder_model_1.toParcelOrderResponse)(populated),
                    invoice: invoice.success ? invoice.data : null,
                    invoiceError: invoice.success ? undefined : invoice.message,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error creating parcel order',
            };
        }
    }
    /**
     * What a booking of this amount would cost the agency, before it is booked.
     * Lets the agency screen show the split (and a low-balance warning) upfront.
     */
    async previewSettlement(amount, actor, agencyId) {
        try {
            const targetAgencyId = actor.role === 'agency' ? actor.agencyId : agencyId;
            if (!targetAgencyId) {
                return { success: false, message: 'Agency is required' };
            }
            const resolved = await this.resolveAgency(targetAgencyId, 'Agency');
            if (resolved.error)
                return resolved.error;
            const agency = resolved.agency;
            // `amount` is the transportation charge the agency is quoting; the split
            // applies to the total the customer actually pays.
            const charges = (0, parcelCharges_1.calculateCharges)(amount || 0, agency);
            const wallet = await (0, walletLedger_1.ensureWallet)(targetAgencyId);
            const split = (0, walletLedger_1.calculateProfitSplit)(charges.totalAmount, (0, parcelCharges_1.effectiveCommissionPercentage)(agency));
            return {
                success: true,
                data: {
                    agencyId: targetAgencyId,
                    // deprecated mirror
                    branchId: targetAgencyId,
                    agencyName: agency.agencyName,
                    type: agency.type,
                    // Ownership as a boolean, same as on the agency record (true = Own)
                    agencyType: agency.type === 'Own',
                    commissionApplicable: agency.type !== 'Own',
                    charges,
                    ...split,
                    walletBalance: (0, walletLedger_1.round2)(wallet.balance),
                    balanceAfterBooking: (0, walletLedger_1.round2)(wallet.balance - split.walletDebitAmount),
                    sufficientBalance: (0, walletLedger_1.round2)(wallet.balance) >= split.walletDebitAmount,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error building the settlement preview',
            };
        }
    }
    /** Inclusive booking-date range on createdAt */
    buildDateRange(dateFrom, dateTo) {
        const range = {};
        if (dateFrom) {
            const from = new Date(dateFrom);
            if (!isNaN(from.getTime()))
                range.$gte = from;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            if (!isNaN(to.getTime())) {
                // A bare date means "up to the end of that day"
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo))
                    to.setHours(23, 59, 59, 999);
                range.$lte = to;
            }
        }
        return Object.keys(range).length ? range : null;
    }
    /**
     * The filters every listing shares, before any actor/direction scoping.
     * `deliveryAgency` is an ObjectId, so it is filtered rather than searched.
     */
    buildBaseQuery(filters) {
        const query = {};
        if (filters.search) {
            query.$and = [
                {
                    $or: [
                        { orderNumber: { $regex: filters.search, $options: 'i' } },
                        { 'bookingCustomer.name': { $regex: filters.search, $options: 'i' } },
                        { 'bookingCustomer.mobileNumber': { $regex: filters.search, $options: 'i' } },
                        { 'deliveryCustomer.name': { $regex: filters.search, $options: 'i' } },
                        { 'deliveryCustomer.mobileNumber': { $regex: filters.search, $options: 'i' } },
                    ],
                },
            ];
        }
        if (filters.status)
            query.status = filters.status;
        if (filters.paymentType)
            query.paymentType = filters.paymentType;
        if (filters.bookingCustomerMobile) {
            query['bookingCustomer.mobileNumber'] = filters.bookingCustomerMobile;
        }
        if (filters.hubAssignment === 'assigned')
            query.hub = { $ne: null };
        if (filters.hubAssignment === 'unassigned')
            query.hub = null;
        if (filters.deliveryAgency && mongoose_1.Types.ObjectId.isValid(filters.deliveryAgency)) {
            query['deliveryCustomer.deliveryAgency'] = filters.deliveryAgency;
        }
        // Booking date range
        const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
        if (range)
            query.createdAt = range;
        return query;
    }
    /** Page of orders (with their invoice), the count and the charge totals */
    async runOrderQuery(query, page, limit) {
        const skip = (page - 1) * limit;
        const [orders, total, sums] = await Promise.all([
            parcelOrder_model_1.ParcelOrder.find(query)
                .populate(POPULATE)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            parcelOrder_model_1.ParcelOrder.countDocuments(query),
            // Totals for the filtered set, so a date-ranged listing can show them
            parcelOrder_model_1.ParcelOrder.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        transportationCharge: { $sum: '$transportationCharge' },
                        loadingCharge: { $sum: '$loadingCharge' },
                        miscellaneousCharge: { $sum: '$miscellaneousCharge' },
                        totalAmount: { $sum: '$totalAmount' },
                    },
                },
            ]),
        ]);
        // Invoice for every row of this page, in a single query
        const invoiceByOrder = await invoice_service_1.invoiceService.getInvoiceSummariesByOrders(orders.map((order) => order._id));
        const t = sums[0] || {
            transportationCharge: 0,
            loadingCharge: 0,
            miscellaneousCharge: 0,
            totalAmount: 0,
        };
        return {
            orders: orders.map((order) => {
                const invoice = invoiceByOrder.get(String(order._id)) || null;
                return {
                    ...(0, parcelOrder_model_1.toParcelOrderResponse)(order),
                    invoice,
                    invoiceId: invoice?._id || null,
                    invoiceNumber: invoice?.invoiceNumber || null,
                };
            }),
            totals: {
                transportationCharge: (0, walletLedger_1.round2)(t.transportationCharge),
                loadingCharge: (0, walletLedger_1.round2)(t.loadingCharge),
                miscellaneousCharge: (0, walletLedger_1.round2)(t.miscellaneousCharge),
                totalAmount: (0, walletLedger_1.round2)(t.totalAmount),
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // List parcel orders with pagination, search and filters (scoped to the actor)
    async getAllParcelOrders(filters, actor) {
        try {
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
            const query = this.buildBaseQuery(filters);
            // Actor scoping wins over any client-supplied agency/hub filter
            if (actor.role === 'agency') {
                // An agency sees what it booked plus what is addressed to it
                let scope;
                if (filters.direction === 'outgoing') {
                    scope = { agency: actor.agencyId };
                }
                else if (filters.direction === 'incoming') {
                    scope = { 'deliveryCustomer.deliveryAgency': actor.agencyId };
                }
                else {
                    scope = {
                        $or: [
                            { agency: actor.agencyId },
                            { 'deliveryCustomer.deliveryAgency': actor.agencyId },
                        ],
                    };
                }
                query.$and = query.$and ? [...query.$and, scope] : [scope];
            }
            else if (actor.role === 'hub') {
                query.hub = actor.hubId;
            }
            else {
                if (filters.agency && mongoose_1.Types.ObjectId.isValid(filters.agency)) {
                    query.agency = filters.agency;
                }
                if (filters.hub && mongoose_1.Types.ObjectId.isValid(filters.hub)) {
                    query.hub = filters.hub;
                }
            }
            return {
                success: true,
                data: await this.runOrderQuery(query, page, limit),
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching parcel orders',
            };
        }
    }
    /**
     * An agency's inward / outward register.
     *
     * outward = parcels booked at this agency and sent out.
     * inward  = parcels booked elsewhere and addressed to this agency for
     *           delivery.
     *
     * An agency login always gets its own register; an admin names the agency
     * with `agency`, since inward/outward only mean anything relative to one.
     * `counterpartAgency` filters the other end of the movement.
     */
    async getAgencyRegister(filters, actor, direction) {
        try {
            const agencyId = actor.role === 'agency' ? actor.agencyId : filters.agency;
            if (!agencyId) {
                return {
                    success: false,
                    message: 'agency is required — an inward/outward register belongs to one agency',
                };
            }
            if (!mongoose_1.Types.ObjectId.isValid(agencyId)) {
                return { success: false, message: 'Invalid agency ID' };
            }
            const agency = await agency_model_1.Agency.findById(agencyId).select(AGENCY_SELECT);
            if (!agency) {
                return { success: false, code: 404, message: 'Agency not found' };
            }
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
            const query = this.buildBaseQuery(filters);
            // The agency's own end of the movement
            if (direction === 'outward') {
                query.agency = new mongoose_1.Types.ObjectId(agencyId);
            }
            else {
                query['deliveryCustomer.deliveryAgency'] = new mongoose_1.Types.ObjectId(agencyId);
            }
            // ...and the other end, when one is asked for
            if (filters.counterpartAgency) {
                if (!mongoose_1.Types.ObjectId.isValid(filters.counterpartAgency)) {
                    return { success: false, message: 'Invalid counterpartAgency ID' };
                }
                const counterpart = new mongoose_1.Types.ObjectId(filters.counterpartAgency);
                if (direction === 'outward') {
                    query['deliveryCustomer.deliveryAgency'] = counterpart;
                }
                else {
                    query.agency = counterpart;
                }
            }
            const result = await this.runOrderQuery(query, page, limit);
            return {
                success: true,
                data: {
                    direction,
                    agency,
                    ...result,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || `Error fetching the ${direction} register`,
            };
        }
    }
    // Get parcel order by ID
    async getParcelOrderById(id, actor) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            const denied = this.assertScope(order, actor);
            if (denied)
                return denied;
            const populated = await parcelOrder_model_1.ParcelOrder.findById(id).populate(POPULATE);
            const invoice = (await invoice_service_1.invoiceService.getInvoiceSummariesByOrders([order._id])).get(String(order._id)) || null;
            return {
                success: true,
                data: {
                    ...(0, parcelOrder_model_1.toParcelOrderResponse)(populated),
                    invoice,
                    invoiceId: invoice?._id || null,
                    invoiceNumber: invoice?.invoiceNumber || null,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching parcel order',
            };
        }
    }
    // Update booking details of a parcel order
    async updateParcelOrder(id, data, actor) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            if (actor.role === 'hub') {
                return {
                    success: false,
                    code: 403,
                    message: 'A hub cannot edit booking details; use the status endpoint',
                };
            }
            const denied = this.assertScope(order, actor);
            if (denied)
                return denied;
            // Only the booking agency (or admin) may edit a booking
            if (actor.role === 'agency' && !this.isOriginAgency(order, actor)) {
                return {
                    success: false,
                    code: 403,
                    message: 'Only the booking agency can edit these details',
                };
            }
            // Only admin may move an order to a different booking agency
            const newAgencyId = pickAgencyId(data);
            if (newAgencyId) {
                if (actor.role !== 'admin') {
                    return {
                        success: false,
                        code: 403,
                        message: 'Only admin can reassign the booking agency',
                    };
                }
                const origin = await this.resolveAgency(newAgencyId, 'Agency');
                if (origin.error)
                    return origin.error;
                order.agency = origin.agency._id;
            }
            // Merge nested objects so partial updates don't wipe existing fields
            if (data.bookingCustomer) {
                order.bookingCustomer = { ...order.bookingCustomer, ...data.bookingCustomer };
            }
            if (data.deliveryCustomer) {
                const { deliveryAgency, deliveryBranch, ...rest } = data.deliveryCustomer;
                order.deliveryCustomer = { ...order.deliveryCustomer, ...rest };
                // Destination agency can be changed until the parcel leaves the hub
                const newDestinationId = deliveryAgency || deliveryBranch;
                if (newDestinationId) {
                    if ((0, parcelOrder_model_1.statusIndex)(order.status) >= (0, parcelOrder_model_1.statusIndex)('Parcel Dispatched from Hub')) {
                        return {
                            success: false,
                            message: `Delivery agency cannot be changed once the parcel status is "${order.status}"`,
                        };
                    }
                    const destination = await this.resolveAgency(newDestinationId, 'Delivery agency');
                    if (destination.error)
                        return destination.error;
                    order.deliveryCustomer.deliveryAgency = destination.agency
                        ._id;
                }
            }
            if (data.parcelDetails) {
                order.parcelDetails = { ...order.parcelDetails, ...data.parcelDetails };
            }
            if (data.pickupAddress !== undefined)
                order.pickupAddress = data.pickupAddress;
            if (data.deliveryAddress !== undefined) {
                order.deliveryAddress = data.deliveryAddress;
            }
            if (data.paymentType !== undefined)
                order.paymentType = data.paymentType;
            if (data.waybill !== undefined)
                order.waybill = data.waybill;
            if (data.vehicleType !== undefined)
                order.vehicleType = data.vehicleType;
            if (data.vehicleCapacity !== undefined) {
                order.vehicleCapacity = data.vehicleCapacity;
            }
            if (data.vehicle !== undefined)
                order.vehicle = data.vehicle || undefined;
            if (data.driver !== undefined)
                order.driver = data.driver || undefined;
            await order.save();
            // Customer / GST details feed the invoice, so keep it in step
            const populated = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
            await invoice_service_1.invoiceService.refreshPartiesForOrder(populated, actor);
            return {
                success: true,
                message: 'Parcel order updated successfully',
                data: (0, parcelOrder_model_1.toParcelOrderResponse)(populated),
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating parcel order',
            };
        }
    }
    /**
     * Admin assigns the hub that will process the parcel booked by an agency.
     * Re-assignment is allowed until the parcel has physically reached the hub.
     */
    async assignHub(id, hubId, actor, note) {
        try {
            if (actor.role !== 'admin') {
                return {
                    success: false,
                    code: 403,
                    message: 'Only admin can assign a hub to a parcel order',
                };
            }
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            if (!mongoose_1.Types.ObjectId.isValid(hubId)) {
                return { success: false, message: 'Invalid hub ID' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            const hub = await hub_model_1.HubModel.findById(hubId);
            if (!hub) {
                return { success: false, message: 'Hub not found' };
            }
            if (!hub.status) {
                return { success: false, message: 'Selected hub is inactive' };
            }
            const alreadyAtHub = (0, parcelOrder_model_1.statusIndex)(order.status) >= (0, parcelOrder_model_1.statusIndex)('Parcel Arrived at Hub');
            if (alreadyAtHub && order.hub?.toString() !== hubId) {
                return {
                    success: false,
                    message: `Hub cannot be changed once the parcel status is "${order.status}"`,
                };
            }
            const isReassignment = !!order.hub && order.hub.toString() !== hubId;
            const previousHubId = order.hub?.toString();
            order.hub = hub._id;
            order.hubAssignedAt = new Date();
            order.hubAssignedBy = actor.id;
            // Advance to "Hub Assigned" only when the order has not already moved past it
            if ((0, parcelOrder_model_1.statusIndex)(order.status) < (0, parcelOrder_model_1.statusIndex)('Hub Assigned')) {
                order.status = 'Hub Assigned';
            }
            order.statusHistory.push({
                status: order.status,
                note: note ||
                    (isReassignment
                        ? `Hub re-assigned to "${hub.hubName}"`
                        : `Hub "${hub.hubName}" assigned`),
                updatedBy: actor.id,
                updatedByRole: actor.role,
                updatedByName: actor.name,
                updatedAt: new Date(),
            });
            await order.save();
            const populated = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
            return {
                success: true,
                message: isReassignment
                    ? `Hub re-assigned to "${hub.hubName}" (was ${previousHubId})`
                    : `Hub "${hub.hubName}" assigned successfully`,
                data: (0, parcelOrder_model_1.toParcelOrderResponse)(populated),
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error assigning hub',
            };
        }
    }
    /**
     * The hub assigns the vehicle + driver that will carry the parcel onward.
     * Admin can do it too (override). Either field may be sent on its own, and
     * `null` clears an existing assignment.
     */
    async assignVehicleAndDriver(id, data, actor) {
        try {
            if (actor.role === 'agency') {
                return {
                    success: false,
                    code: 403,
                    message: 'Only the hub (or admin) can assign a vehicle and driver',
                };
            }
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            if (data.vehicle === undefined && data.driver === undefined) {
                return { success: false, message: 'Provide a vehicle and/or a driver' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            const denied = this.assertScope(order, actor);
            if (denied)
                return denied;
            const changes = [];
            if (data.vehicle !== undefined) {
                if (!data.vehicle) {
                    order.vehicle = undefined;
                    changes.push('vehicle cleared');
                }
                else {
                    if (!mongoose_1.Types.ObjectId.isValid(data.vehicle)) {
                        return { success: false, message: 'Invalid vehicle ID' };
                    }
                    const vehicle = await vehicle_model_1.Vehicle.findById(data.vehicle);
                    if (!vehicle) {
                        return { success: false, message: 'Vehicle not found' };
                    }
                    if (vehicle.status !== 'Active') {
                        return { success: false, message: 'Selected vehicle is inactive' };
                    }
                    order.vehicle = vehicle._id;
                    changes.push(`vehicle ${vehicle.vehicleRegistrationNumber}`);
                }
            }
            if (data.driver !== undefined) {
                if (!data.driver) {
                    order.driver = undefined;
                    changes.push('driver cleared');
                }
                else {
                    if (!mongoose_1.Types.ObjectId.isValid(data.driver)) {
                        return { success: false, message: 'Invalid driver ID' };
                    }
                    const driver = await driver_model_1.Driver.findById(data.driver);
                    if (!driver) {
                        return { success: false, message: 'Driver not found' };
                    }
                    if (driver.status !== 'Active') {
                        return { success: false, message: 'Selected driver is inactive' };
                    }
                    order.driver = driver._id;
                    changes.push(`driver ${driver.driverName}`);
                }
            }
            order.dispatchAssignedAt = new Date();
            order.dispatchAssignedBy = actor.id;
            order.statusHistory.push({
                status: order.status,
                note: data.note || `Assigned ${changes.join(' and ')}`,
                updatedBy: actor.id,
                updatedByRole: actor.role,
                updatedByName: actor.name,
                updatedAt: new Date(),
            });
            await order.save();
            const populated = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
            return {
                success: true,
                message: `Assigned ${changes.join(' and ')} successfully`,
                data: (0, parcelOrder_model_1.toParcelOrderResponse)(populated),
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error assigning vehicle and driver',
            };
        }
    }
    /** Dropdown source: active agencies available as a destination */
    async getDeliveryAgencyOptions(search) {
        try {
            const query = { status: 'Active' };
            if (search) {
                query.$or = [
                    { agencyName: { $regex: search, $options: 'i' } },
                    { city: { $regex: search, $options: 'i' } },
                    { pincode: { $regex: search, $options: 'i' } },
                ];
            }
            const agencies = await agency_model_1.Agency.find(query)
                .select('agencyName agencyOwner phone city state pincode type')
                .sort({ agencyName: 1 });
            return { success: true, data: agencies };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching delivery agencies',
            };
        }
    }
    /** Dropdown source: active vehicles the hub can assign */
    async getVehicleOptions(search) {
        try {
            const query = { status: 'Active' };
            if (search) {
                query.$or = [
                    { vehicleRegistrationNumber: { $regex: search, $options: 'i' } },
                    { vehicleType: { $regex: search, $options: 'i' } },
                ];
            }
            const vehicles = await vehicle_model_1.Vehicle.find(query)
                .select('vehicleType vehicleRegistrationNumber capacity')
                .sort({ vehicleRegistrationNumber: 1 });
            return { success: true, data: vehicles };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching vehicles',
            };
        }
    }
    /** Dropdown source: active drivers the hub can assign */
    async getDriverOptions(search) {
        try {
            const query = { status: 'Active' };
            if (search) {
                query.$or = [
                    { driverName: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                    { licenseNumber: { $regex: search, $options: 'i' } },
                ];
            }
            const drivers = await driver_model_1.Driver.find(query)
                .select('driverName phoneNumber licenseNumber dateOfExpiry')
                .sort({ driverName: 1 });
            return { success: true, data: drivers };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching drivers',
            };
        }
    }
    /**
     * 2.4 Update the transportation charge.
     *
     * Loading and miscellaneous charges are recalculated from it, the total is
     * re-derived, and both the wallet settlement and the invoice follow.
     */
    async updateTransportationCharge(id, transportationCharge, actor, overrides) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            if (actor.role === 'hub') {
                return {
                    success: false,
                    code: 403,
                    message: 'A hub cannot change the transportation charge',
                };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            const denied = this.assertScope(order, actor);
            if (denied)
                return denied;
            if (actor.role === 'agency' && !this.isOriginAgency(order, actor)) {
                return {
                    success: false,
                    code: 403,
                    message: 'Only the booking agency can change the transportation charge',
                };
            }
            const previousTotal = order.totalAmount || 0;
            // Loading and miscellaneous are re-derived from the new base charge,
            // reusing the percentages the booking was made under.
            const charges = (0, parcelCharges_1.calculateCharges)(transportationCharge, {
                loadingChargePercentage: order.loadingChargePercentage,
                miscChargePercentage: order.miscChargePercentage,
            }, overrides);
            if ((0, walletLedger_1.round2)(previousTotal) === charges.totalAmount) {
                const unchanged = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
                return {
                    success: true,
                    message: 'Charges are unchanged',
                    data: (0, parcelOrder_model_1.toParcelOrderResponse)(unchanged),
                };
            }
            // The settlement follows the total the customer pays, so move only the
            // difference between the old and new booking amount.
            const adjustment = await parcelSettlement_service_1.parcelSettlementService.adjustForChargeChange(order, previousTotal, charges.totalAmount, actor);
            if (!adjustment.success) {
                return {
                    success: false,
                    code: adjustment.code || 400,
                    message: adjustment.message,
                };
            }
            Object.assign(order, charges);
            await order.save();
            const populated = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
            const invoice = await invoice_service_1.invoiceService.syncCharges(populated, actor, 'Transportation charge revised');
            return {
                success: true,
                message: `Charges updated: transport ₹${charges.transportationCharge} + loading ₹${charges.loadingCharge} + misc ₹${charges.miscellaneousCharge} = ₹${charges.totalAmount}. ${adjustment.message}`,
                data: {
                    ...(0, parcelOrder_model_1.toParcelOrderResponse)(populated),
                    invoice: invoice.data || null,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating transportation charge',
            };
        }
    }
    /**
     * 2.5 Update parcel status (records history).
     *
     * Rules:
     *  - agency may set only AGENCY_ALLOWED_STATUSES, on its own orders
     *  - hub may set only HUB_ALLOWED_STATUSES, on orders assigned to it
     *  - admin may set any status (override)
     *  - the lifecycle only moves forward
     *  - hub stages require a hub to be assigned first
     */
    async updateStatus(id, status, actor, note) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            const denied = this.assertScope(order, actor);
            if (denied)
                return denied;
            // Which statuses is this actor allowed to set?
            if (actor.role === 'agency') {
                if (!parcelOrder_model_1.AGENCY_ALLOWED_STATUSES.includes(status)) {
                    return {
                        success: false,
                        code: 403,
                        message: `An agency cannot set "${status}". Allowed: ${parcelOrder_model_1.AGENCY_ALLOWED_STATUSES.join(', ')}`,
                    };
                }
                // Origin stages belong to the booking branch, delivery stages to the
                // destination branch (they are the same branch for a local booking).
                if (parcelOrder_model_1.ORIGIN_AGENCY_STATUSES.includes(status) &&
                    !this.isOriginAgency(order, actor)) {
                    return {
                        success: false,
                        code: 403,
                        message: `Only the booking agency can set "${status}"`,
                    };
                }
                if (parcelOrder_model_1.DESTINATION_AGENCY_STATUSES.includes(status) &&
                    !this.isDestinationAgency(order, actor)) {
                    return {
                        success: false,
                        code: 403,
                        message: `Only the delivery agency can set "${status}"`,
                    };
                }
            }
            if (actor.role === 'hub' && !parcelOrder_model_1.HUB_ALLOWED_STATUSES.includes(status)) {
                return {
                    success: false,
                    code: 403,
                    message: `A hub cannot set "${status}". Allowed: ${parcelOrder_model_1.HUB_ALLOWED_STATUSES.join(', ')}`,
                };
            }
            if (order.status === status) {
                return { success: false, message: `Order is already in "${status}" status` };
            }
            // Lifecycle moves forward only
            if ((0, parcelOrder_model_1.statusIndex)(status) < (0, parcelOrder_model_1.statusIndex)(order.status)) {
                return {
                    success: false,
                    message: `Cannot move back from "${order.status}" to "${status}"`,
                };
            }
            // Hub stages need a hub
            if (parcelOrder_model_1.HUB_DEPENDENT_STATUSES.includes(status) && !order.hub) {
                return {
                    success: false,
                    message: `No hub assigned yet. Admin must assign a hub before "${status}"`,
                };
            }
            order.status = status;
            order.statusHistory.push({
                status,
                note,
                updatedBy: actor.id,
                updatedByRole: actor.role,
                updatedByName: actor.name,
                updatedAt: new Date(),
            });
            await order.save();
            const populated = await parcelOrder_model_1.ParcelOrder.findById(order._id).populate(POPULATE);
            return {
                success: true,
                message: `Parcel status updated to "${status}"`,
                data: (0, parcelOrder_model_1.toParcelOrderResponse)(populated),
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error updating parcel status',
            };
        }
    }
    // Tracking timeline for a single order
    async getTracking(id, actor) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id).populate(POPULATE);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            const denied = this.assertScope(order, actor);
            if (denied)
                return denied;
            return {
                success: true,
                data: {
                    orderNumber: order.orderNumber,
                    currentStatus: order.status,
                    currentStatusLabel: (0, parcelOrder_model_1.statusLabel)(order.status),
                    agency: order.agency,
                    deliveryAgency: order.deliveryCustomer.deliveryAgency,
                    // deprecated mirrors
                    branch: order.agency,
                    deliveryBranch: order.deliveryCustomer.deliveryAgency,
                    pickupAddress: order.pickupAddress,
                    deliveryAddress: order.deliveryAddress,
                    charges: {
                        transportationCharge: order.transportationCharge,
                        loadingChargePercentage: order.loadingChargePercentage,
                        loadingCharge: order.loadingCharge,
                        miscChargePercentage: order.miscChargePercentage,
                        miscellaneousCharge: order.miscellaneousCharge,
                        totalAmount: order.totalAmount,
                    },
                    hub: order.hub || null,
                    hubAssignedAt: order.hubAssignedAt || null,
                    vehicle: order.vehicle || null,
                    driver: order.driver || null,
                    dispatchAssignedAt: order.dispatchAssignedAt || null,
                    timeline: order.statusHistory.map((entry) => {
                        const row = typeof entry.toObject === 'function' ? entry.toObject() : entry;
                        return {
                            ...row,
                            statusLabel: (0, parcelOrder_model_1.statusLabel)(row.status),
                            updatedByRole: row.updatedByRole === 'branch' ? 'agency' : row.updatedByRole,
                        };
                    }),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching tracking details',
            };
        }
    }
    // Delete parcel order (admin only)
    async deleteParcelOrder(id, actor) {
        try {
            if (actor.role !== 'admin') {
                return {
                    success: false,
                    code: 403,
                    message: 'Only admin can delete a parcel order',
                };
            }
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return { success: false, message: 'Invalid order ID' };
            }
            const order = await parcelOrder_model_1.ParcelOrder.findById(id);
            if (!order) {
                return { success: false, code: 404, message: 'Parcel order not found' };
            }
            // Give the agency its money back before the order disappears
            const reversal = await parcelSettlement_service_1.parcelSettlementService.reverseSettlement(id, actor, 'Parcel order deleted');
            if (!reversal.success) {
                return {
                    success: false,
                    code: reversal.code || 400,
                    message: `Order not deleted - the wallet settlement could not be reversed: ${reversal.message}`,
                };
            }
            // Cancel the invoice rather than dropping it, so the numbering stays intact
            const invoice = await invoice_service_1.invoiceService.cancelForOrder(id, actor, 'Parcel order deleted');
            await parcelOrder_model_1.ParcelOrder.findByIdAndDelete(id);
            return {
                success: true,
                message: `Parcel order deleted successfully. ${reversal.message}.${invoice.data ? ` ${invoice.message}` : ''}`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error deleting parcel order',
            };
        }
    }
}
exports.ParcelOrderService = ParcelOrderService;
exports.parcelOrderService = new ParcelOrderService();
