import {
  ParcelOrder,
  ParcelStatus,
  AGENCY_ALLOWED_STATUSES,
  ORIGIN_AGENCY_STATUSES,
  DESTINATION_AGENCY_STATUSES,
  HUB_ALLOWED_STATUSES,
  HUB_DEPENDENT_STATUSES,
  statusIndex,
  statusLabel,
  toParcelOrderResponse,
} from '../../models/admin/parcelOrder.model';
import { Agency } from '../../models/admin/agency.model';
import { HubModel } from '../../models/hub/hub.model';
import { Vehicle } from '../../models/admin/vehicle.model';
import { Driver } from '../../models/admin/driver.model';
import { ParcelActor } from '../../utils/parcelActor';
import { parcelSettlementService } from './parcelSettlement.service';
import { invoiceService } from './invoice.service';
import { calculateProfitSplit, ensureWallet, round2 } from '../../utils/walletLedger';
import { calculateCharges, effectiveCommissionPercentage } from '../../utils/parcelCharges';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  /** HTTP status the controller should use; defaults are applied per endpoint */
  code?: number;
}

interface CustomerInput {
  name: string;
  mobileNumber: string;
  address?: string;
  gstNumber?: string;
}

/**
 * `agency` is the current field name; `branch` is the deprecated spelling still
 * accepted from the existing frontend. Same for deliveryAgency/deliveryBranch.
 */
interface CreateParcelOrderInput {
  agency?: string;
  branch?: string;
  bookingCustomer: CustomerInput;
  paymentType: string;
  deliveryCustomer: CustomerInput & {
    deliveryAgency?: string;
    deliveryBranch?: string;
  };
  /** Where the parcel is collected from / dropped at */
  pickupAddress?: string;
  deliveryAddress?: string;
  parcelDetails: {
    article: string;
    remarks?: string;
    numberOfParcels: number;
    approximateValue?: number;
  };
  transportationCharge?: number;
  /** Optional overrides; otherwise derived from the agency's percentages */
  loadingCharge?: number;
  miscellaneousCharge?: number;
  /** Carrier waybill / AWB number written on the consignment note */
  waybill?: string;
  /** Vehicle class and capacity as stated on the booking form (free text) */
  vehicleType?: string;
  vehicleCapacity?: string;
  vehicle?: string;
  driver?: string;
}

export interface ParcelListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  agency?: string;
  deliveryAgency?: string;
  hub?: string;
  paymentType?: string;
  /** 'assigned' -> hub is set, 'unassigned' -> hub is not set */
  hubAssignment?: 'assigned' | 'unassigned';
  /** agency actors only: 'outgoing' = booked here, 'incoming' = addressed here */
  direction?: 'outgoing' | 'incoming';
  /**
   * Inward/outward registers only: the agency at the *other* end of the
   * movement — the origin on an inward register, the destination on an
   * outward one. `agency` there means the agency whose register it is.
   */
  counterpartAgency?: string;
  /**
   * Every booking made by one customer — the mobile number is what identifies a
   * booking customer, they have no record of their own (see
   * BookingCustomerService).
   */
  bookingCustomerMobile?: string;
  /** Booking date range, inclusive (YYYY-MM-DD or a full ISO timestamp) */
  dateFrom?: string;
  dateTo?: string;
}

/** An agency's parcel movement: outward = booked here, inward = arriving here */
export type RegisterDirection = 'inward' | 'outward';

const AGENCY_SELECT =
  'agencyName agencyOwner phone city state pincode status type profitPercentage';

const POPULATE = [
  { path: 'agency', select: AGENCY_SELECT },
  { path: 'deliveryCustomer.deliveryAgency', select: AGENCY_SELECT },
  { path: 'hub', select: 'hubName hubManagerName phoneNo city state pincode status' },
  { path: 'vehicle', select: 'vehicleType vehicleRegistrationNumber capacity status' },
  { path: 'driver', select: 'driverName phoneNumber licenseNumber status' },
];

/** Read the agency id from either the current or the deprecated key */
const pickAgencyId = (data: any): string | undefined => data?.agency || data?.branch;
const pickDeliveryAgencyId = (customer: any): string | undefined =>
  customer?.deliveryAgency || customer?.deliveryBranch;

export class ParcelOrderService {
  /** A running number as three groups of three digits: 3611380 -> 003-611-380 */
  private formatOrderNumber(seq: number): string {
    const digits = String(seq).padStart(9, '0').slice(-9);
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Generate a unique, readable order number
  private async generateOrderNumber(): Promise<string> {
    const count = await ParcelOrder.countDocuments();
    let seq = count + 1;
    // Ensure uniqueness even if older records were deleted
    let orderNumber = this.formatOrderNumber(seq);
    while (await ParcelOrder.exists({ orderNumber })) {
      seq += 1;
      orderNumber = this.formatOrderNumber(seq);
    }
    return orderNumber;
  }

  /** Is this agency actor the order's booking (origin) agency? */
  private isOriginAgency(order: any, actor: ParcelActor): boolean {
    const origin = order.agency;
    const originId = origin?._id ? origin._id.toString() : origin?.toString();
    return originId === actor.agencyId;
  }

  /** Is this agency actor the order's delivery (destination) agency? */
  private isDestinationAgency(order: any, actor: ParcelActor): boolean {
    const dest = order.deliveryCustomer?.deliveryAgency;
    // Populated documents expose _id; raw ones are plain ObjectIds
    const destId = dest?._id ? dest._id.toString() : dest?.toString();
    return destId === actor.agencyId;
  }

  /**
   * An agency may only touch orders it books or receives; a hub only orders
   * routed to it. Admin sees everything.
   */
  private assertScope(order: any, actor: ParcelActor): ServiceResponse | null {
    if (actor.role === 'admin') return null;

    if (actor.role === 'agency') {
      if (!this.isOriginAgency(order, actor) && !this.isDestinationAgency(order, actor)) {
        return {
          success: false,
          code: 403,
          message:
            'This parcel order was neither booked at nor addressed to your agency',
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
  private async resolveAgency(
    agencyId: string,
    label: string
  ): Promise<{ agency?: any; error?: ServiceResponse }> {
    if (!agencyId || !Types.ObjectId.isValid(agencyId)) {
      return { error: { success: false, message: `Invalid ${label} ID` } };
    }
    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return { error: { success: false, message: `${label} not found` } };
    }
    if (agency.status !== 'Active') {
      return { error: { success: false, message: `Selected ${label} is inactive` } };
    }
    return { agency };
  }

  // 2.3 Create parcel order (booked by an agency, or by admin on an agency's behalf)
  async createParcelOrder(
    data: CreateParcelOrderInput,
    actor: ParcelActor
  ): Promise<ServiceResponse> {
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
      if (origin.error) return origin.error;
      const agency = origin.agency;

      // Destination agency is chosen from the available-agencies dropdown. It
      // is optional — a booking can be taken before the delivering agency is
      // known and the agency set later from the update endpoint.
      const destinationId = pickDeliveryAgencyId(data.deliveryCustomer);
      const destination: { agency?: any; error?: ServiceResponse } = destinationId
        ? await this.resolveAgency(destinationId, 'Delivery agency')
        : {};
      if (destination.error) return destination.error;
      const destinationAgency = destination.agency;

      // Loading + miscellaneous are derived from the transportation charge
      const charges = calculateCharges(data.transportationCharge ?? 0, agency, {
        loadingCharge: data.loadingCharge,
        miscellaneousCharge: data.miscellaneousCharge,
      });

      const orderNumber = await this.generateOrderNumber();

      const { deliveryAgency, deliveryBranch, ...deliveryRest } = data.deliveryCustomer;

      const order = new ParcelOrder({
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
      const settlement = await parcelSettlementService.settleOrder(order, actor, {
        agency,
      });

      if (!settlement.success) {
        await ParcelOrder.findByIdAndDelete(order._id);
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
      const invoice = await invoiceService.createForOrder(order, actor, {
        agency,
        deliveryAgency: destinationAgency,
      });

      if (!invoice.success) {
        console.error(
          `Invoice not raised for parcel order ${order.orderNumber}: ${invoice.message}`
        );
      }

      const populated = await ParcelOrder.findById(order._id).populate(POPULATE);

      return {
        success: true,
        message: `Parcel order created successfully. ${settlement.message}${
          invoice.success ? '' : ` Invoice not raised: ${invoice.message}`
        }`,
        data: {
          ...toParcelOrderResponse(populated),
          invoice: invoice.success ? invoice.data : null,
          invoiceError: invoice.success ? undefined : invoice.message,
        },
      };
    } catch (error: any) {
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
  async previewSettlement(
    amount: number,
    actor: ParcelActor,
    agencyId?: string
  ): Promise<ServiceResponse> {
    try {
      const targetAgencyId = actor.role === 'agency' ? actor.agencyId : agencyId;

      if (!targetAgencyId) {
        return { success: false, message: 'Agency is required' };
      }

      const resolved = await this.resolveAgency(targetAgencyId, 'Agency');
      if (resolved.error) return resolved.error;
      const agency = resolved.agency;

      // `amount` is the transportation charge the agency is quoting; the split
      // applies to the total the customer actually pays.
      const charges = calculateCharges(amount || 0, agency);
      const wallet = await ensureWallet(targetAgencyId);
      const split = calculateProfitSplit(
        charges.totalAmount,
        effectiveCommissionPercentage(agency)
      );

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
          walletBalance: round2(wallet.balance),
          balanceAfterBooking: round2(wallet.balance - split.walletDebitAmount),
          sufficientBalance: round2(wallet.balance) >= split.walletDebitAmount,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error building the settlement preview',
      };
    }
  }

  /** Inclusive booking-date range on createdAt */
  private buildDateRange(dateFrom?: string, dateTo?: string) {
    const range: any = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) range.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        // A bare date means "up to the end of that day"
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
    }
    return Object.keys(range).length ? range : null;
  }

  /**
   * The filters every listing shares, before any actor/direction scoping.
   * `deliveryAgency` is an ObjectId, so it is filtered rather than searched.
   */
  private buildBaseQuery(filters: ParcelListFilters): any {
    const query: any = {};

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

    if (filters.status) query.status = filters.status;
    if (filters.paymentType) query.paymentType = filters.paymentType;

    if (filters.bookingCustomerMobile) {
      query['bookingCustomer.mobileNumber'] = filters.bookingCustomerMobile;
    }

    if (filters.hubAssignment === 'assigned') query.hub = { $ne: null };
    if (filters.hubAssignment === 'unassigned') query.hub = null;

    if (filters.deliveryAgency && Types.ObjectId.isValid(filters.deliveryAgency)) {
      query['deliveryCustomer.deliveryAgency'] = filters.deliveryAgency;
    }

    // Booking date range
    const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
    if (range) query.createdAt = range;

    return query;
  }

  /** Page of orders (with their invoice), the count and the charge totals */
  private async runOrderQuery(query: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total, sums] = await Promise.all([
      ParcelOrder.find(query)
        .populate(POPULATE)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ParcelOrder.countDocuments(query),
      // Totals for the filtered set, so a date-ranged listing can show them
      ParcelOrder.aggregate([
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
    const invoiceByOrder = await invoiceService.getInvoiceSummariesByOrders(
      orders.map((order) => order._id)
    );

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
          ...toParcelOrderResponse(order),
          invoice,
          invoiceId: invoice?._id || null,
          invoiceNumber: invoice?.invoiceNumber || null,
        };
      }),
      totals: {
        transportationCharge: round2(t.transportationCharge),
        loadingCharge: round2(t.loadingCharge),
        miscellaneousCharge: round2(t.miscellaneousCharge),
        totalAmount: round2(t.totalAmount),
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
  async getAllParcelOrders(
    filters: ParcelListFilters,
    actor: ParcelActor
  ): Promise<ServiceResponse> {
    try {
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const query = this.buildBaseQuery(filters);

      // Actor scoping wins over any client-supplied agency/hub filter
      if (actor.role === 'agency') {
        // An agency sees what it booked plus what is addressed to it
        let scope: any;
        if (filters.direction === 'outgoing') {
          scope = { agency: actor.agencyId };
        } else if (filters.direction === 'incoming') {
          scope = { 'deliveryCustomer.deliveryAgency': actor.agencyId };
        } else {
          scope = {
            $or: [
              { agency: actor.agencyId },
              { 'deliveryCustomer.deliveryAgency': actor.agencyId },
            ],
          };
        }
        query.$and = query.$and ? [...query.$and, scope] : [scope];
      } else if (actor.role === 'hub') {
        query.hub = actor.hubId;
      } else {
        if (filters.agency && Types.ObjectId.isValid(filters.agency)) {
          query.agency = filters.agency;
        }
        if (filters.hub && Types.ObjectId.isValid(filters.hub)) {
          query.hub = filters.hub;
        }
      }

      return {
        success: true,
        data: await this.runOrderQuery(query, page, limit),
      };
    } catch (error: any) {
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
  async getAgencyRegister(
    filters: ParcelListFilters,
    actor: ParcelActor,
    direction: RegisterDirection
  ): Promise<ServiceResponse> {
    try {
      const agencyId = actor.role === 'agency' ? actor.agencyId : filters.agency;

      if (!agencyId) {
        return {
          success: false,
          message: 'agency is required — an inward/outward register belongs to one agency',
        };
      }
      if (!Types.ObjectId.isValid(agencyId)) {
        return { success: false, message: 'Invalid agency ID' };
      }

      const agency = await Agency.findById(agencyId).select(AGENCY_SELECT);
      if (!agency) {
        return { success: false, code: 404, message: 'Agency not found' };
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const query = this.buildBaseQuery(filters);

      // The agency's own end of the movement
      if (direction === 'outward') {
        query.agency = new Types.ObjectId(agencyId);
      } else {
        query['deliveryCustomer.deliveryAgency'] = new Types.ObjectId(agencyId);
      }

      // ...and the other end, when one is asked for
      if (filters.counterpartAgency) {
        if (!Types.ObjectId.isValid(filters.counterpartAgency)) {
          return { success: false, message: 'Invalid counterpartAgency ID' };
        }
        const counterpart = new Types.ObjectId(filters.counterpartAgency);
        if (direction === 'outward') {
          query['deliveryCustomer.deliveryAgency'] = counterpart;
        } else {
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
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `Error fetching the ${direction} register`,
      };
    }
  }

  // Get parcel order by ID
  async getParcelOrderById(id: string, actor: ParcelActor): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const order = await ParcelOrder.findById(id);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      const denied = this.assertScope(order, actor);
      if (denied) return denied;

      const populated = await ParcelOrder.findById(id).populate(POPULATE);
      const invoice = (
        await invoiceService.getInvoiceSummariesByOrders([order._id])
      ).get(String(order._id)) || null;

      return {
        success: true,
        data: {
          ...toParcelOrderResponse(populated),
          invoice,
          invoiceId: invoice?._id || null,
          invoiceNumber: invoice?.invoiceNumber || null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching parcel order',
      };
    }
  }

  // Update booking details of a parcel order
  async updateParcelOrder(
    id: string,
    data: any,
    actor: ParcelActor
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const order = await ParcelOrder.findById(id);
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
      if (denied) return denied;

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
        if (origin.error) return origin.error;
        order.agency = origin.agency._id as Types.ObjectId;
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
          if (statusIndex(order.status) >= statusIndex('Parcel Dispatched from Hub')) {
            return {
              success: false,
              message: `Delivery agency cannot be changed once the parcel status is "${order.status}"`,
            };
          }
          const destination = await this.resolveAgency(
            newDestinationId,
            'Delivery agency'
          );
          if (destination.error) return destination.error;
          order.deliveryCustomer.deliveryAgency = destination.agency
            ._id as Types.ObjectId;
        }
      }
      if (data.parcelDetails) {
        order.parcelDetails = { ...order.parcelDetails, ...data.parcelDetails };
      }
      if (data.pickupAddress !== undefined) order.pickupAddress = data.pickupAddress;
      if (data.deliveryAddress !== undefined) {
        order.deliveryAddress = data.deliveryAddress;
      }
      if (data.paymentType !== undefined) order.paymentType = data.paymentType;
      if (data.waybill !== undefined) order.waybill = data.waybill;
      if (data.vehicleType !== undefined) order.vehicleType = data.vehicleType;
      if (data.vehicleCapacity !== undefined) {
        order.vehicleCapacity = data.vehicleCapacity;
      }
      if (data.vehicle !== undefined) order.vehicle = data.vehicle || undefined;
      if (data.driver !== undefined) order.driver = data.driver || undefined;

      await order.save();

      // Customer / GST details feed the invoice, so keep it in step
      const populated = await ParcelOrder.findById(order._id).populate(POPULATE);
      await invoiceService.refreshPartiesForOrder(populated, actor);

      return {
        success: true,
        message: 'Parcel order updated successfully',
        data: toParcelOrderResponse(populated),
      };
    } catch (error: any) {
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
  async assignHub(
    id: string,
    hubId: string,
    actor: ParcelActor,
    note?: string
  ): Promise<ServiceResponse> {
    try {
      if (actor.role !== 'admin') {
        return {
          success: false,
          code: 403,
          message: 'Only admin can assign a hub to a parcel order',
        };
      }
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }
      if (!Types.ObjectId.isValid(hubId)) {
        return { success: false, message: 'Invalid hub ID' };
      }

      const order = await ParcelOrder.findById(id);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      const hub = await HubModel.findById(hubId);
      if (!hub) {
        return { success: false, message: 'Hub not found' };
      }
      if (!hub.status) {
        return { success: false, message: 'Selected hub is inactive' };
      }

      const alreadyAtHub =
        statusIndex(order.status) >= statusIndex('Parcel Arrived at Hub');
      if (alreadyAtHub && order.hub?.toString() !== hubId) {
        return {
          success: false,
          message: `Hub cannot be changed once the parcel status is "${order.status}"`,
        };
      }

      const isReassignment = !!order.hub && order.hub.toString() !== hubId;
      const previousHubId = order.hub?.toString();

      order.hub = hub._id as Types.ObjectId;
      order.hubAssignedAt = new Date();
      order.hubAssignedBy = actor.id;

      // Advance to "Hub Assigned" only when the order has not already moved past it
      if (statusIndex(order.status) < statusIndex('Hub Assigned')) {
        order.status = 'Hub Assigned';
      }

      order.statusHistory.push({
        status: order.status,
        note:
          note ||
          (isReassignment
            ? `Hub re-assigned to "${hub.hubName}"`
            : `Hub "${hub.hubName}" assigned`),
        updatedBy: actor.id,
        updatedByRole: actor.role,
        updatedByName: actor.name,
        updatedAt: new Date(),
      });

      await order.save();
      const populated = await ParcelOrder.findById(order._id).populate(POPULATE);

      return {
        success: true,
        message: isReassignment
          ? `Hub re-assigned to "${hub.hubName}" (was ${previousHubId})`
          : `Hub "${hub.hubName}" assigned successfully`,
        data: toParcelOrderResponse(populated),
      };
    } catch (error: any) {
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
  async assignVehicleAndDriver(
    id: string,
    data: { vehicle?: string | null; driver?: string | null; note?: string },
    actor: ParcelActor
  ): Promise<ServiceResponse> {
    try {
      if (actor.role === 'agency') {
        return {
          success: false,
          code: 403,
          message: 'Only the hub (or admin) can assign a vehicle and driver',
        };
      }
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }
      if (data.vehicle === undefined && data.driver === undefined) {
        return { success: false, message: 'Provide a vehicle and/or a driver' };
      }

      const order = await ParcelOrder.findById(id);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      const denied = this.assertScope(order, actor);
      if (denied) return denied;

      const changes: string[] = [];

      if (data.vehicle !== undefined) {
        if (!data.vehicle) {
          order.vehicle = undefined;
          changes.push('vehicle cleared');
        } else {
          if (!Types.ObjectId.isValid(data.vehicle)) {
            return { success: false, message: 'Invalid vehicle ID' };
          }
          const vehicle = await Vehicle.findById(data.vehicle);
          if (!vehicle) {
            return { success: false, message: 'Vehicle not found' };
          }
          if (vehicle.status !== 'Active') {
            return { success: false, message: 'Selected vehicle is inactive' };
          }
          order.vehicle = vehicle._id as Types.ObjectId;
          changes.push(`vehicle ${vehicle.vehicleRegistrationNumber}`);
        }
      }

      if (data.driver !== undefined) {
        if (!data.driver) {
          order.driver = undefined;
          changes.push('driver cleared');
        } else {
          if (!Types.ObjectId.isValid(data.driver)) {
            return { success: false, message: 'Invalid driver ID' };
          }
          const driver = await Driver.findById(data.driver);
          if (!driver) {
            return { success: false, message: 'Driver not found' };
          }
          if (driver.status !== 'Active') {
            return { success: false, message: 'Selected driver is inactive' };
          }
          order.driver = driver._id as Types.ObjectId;
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
      const populated = await ParcelOrder.findById(order._id).populate(POPULATE);

      return {
        success: true,
        message: `Assigned ${changes.join(' and ')} successfully`,
        data: toParcelOrderResponse(populated),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error assigning vehicle and driver',
      };
    }
  }

  /** Dropdown source: active agencies available as a destination */
  async getDeliveryAgencyOptions(search?: string): Promise<ServiceResponse> {
    try {
      const query: any = { status: 'Active' };
      if (search) {
        query.$or = [
          { agencyName: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { pincode: { $regex: search, $options: 'i' } },
        ];
      }

      const agencies = await Agency.find(query)
        .select('agencyName agencyOwner phone city state pincode type')
        .sort({ agencyName: 1 });

      return { success: true, data: agencies };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching delivery agencies',
      };
    }
  }

  /** Dropdown source: active vehicles the hub can assign */
  async getVehicleOptions(search?: string): Promise<ServiceResponse> {
    try {
      const query: any = { status: 'Active' };
      if (search) {
        query.$or = [
          { vehicleRegistrationNumber: { $regex: search, $options: 'i' } },
          { vehicleType: { $regex: search, $options: 'i' } },
        ];
      }

      const vehicles = await Vehicle.find(query)
        .select('vehicleType vehicleRegistrationNumber capacity')
        .sort({ vehicleRegistrationNumber: 1 });

      return { success: true, data: vehicles };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching vehicles',
      };
    }
  }

  /** Dropdown source: active drivers the hub can assign */
  async getDriverOptions(search?: string): Promise<ServiceResponse> {
    try {
      const query: any = { status: 'Active' };
      if (search) {
        query.$or = [
          { driverName: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { licenseNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const drivers = await Driver.find(query)
        .select('driverName phoneNumber licenseNumber dateOfExpiry')
        .sort({ driverName: 1 });

      return { success: true, data: drivers };
    } catch (error: any) {
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
  async updateTransportationCharge(
    id: string,
    transportationCharge: number,
    actor: ParcelActor,
    overrides?: { loadingCharge?: number; miscellaneousCharge?: number }
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }

      if (actor.role === 'hub') {
        return {
          success: false,
          code: 403,
          message: 'A hub cannot change the transportation charge',
        };
      }

      const order = await ParcelOrder.findById(id);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      const denied = this.assertScope(order, actor);
      if (denied) return denied;

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
      const charges = calculateCharges(
        transportationCharge,
        {
          loadingChargePercentage: order.loadingChargePercentage,
          miscChargePercentage: order.miscChargePercentage,
        },
        overrides
      );

      if (round2(previousTotal) === charges.totalAmount) {
        const unchanged = await ParcelOrder.findById(order._id).populate(POPULATE);
        return {
          success: true,
          message: 'Charges are unchanged',
          data: toParcelOrderResponse(unchanged),
        };
      }

      // The settlement follows the total the customer pays, so move only the
      // difference between the old and new booking amount.
      const adjustment = await parcelSettlementService.adjustForChargeChange(
        order,
        previousTotal,
        charges.totalAmount,
        actor
      );

      if (!adjustment.success) {
        return {
          success: false,
          code: adjustment.code || 400,
          message: adjustment.message,
        };
      }

      Object.assign(order, charges);
      await order.save();

      const populated = await ParcelOrder.findById(order._id).populate(POPULATE);
      const invoice = await invoiceService.syncCharges(
        populated,
        actor,
        'Transportation charge revised'
      );

      return {
        success: true,
        message: `Charges updated: transport ₹${charges.transportationCharge} + loading ₹${charges.loadingCharge} + misc ₹${charges.miscellaneousCharge} = ₹${charges.totalAmount}. ${adjustment.message}`,
        data: {
          ...toParcelOrderResponse(populated),
          invoice: invoice.data || null,
        },
      };
    } catch (error: any) {
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
  async updateStatus(
    id: string,
    status: ParcelStatus,
    actor: ParcelActor,
    note?: string
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const order = await ParcelOrder.findById(id);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      const denied = this.assertScope(order, actor);
      if (denied) return denied;

      // Which statuses is this actor allowed to set?
      if (actor.role === 'agency') {
        if (!AGENCY_ALLOWED_STATUSES.includes(status)) {
          return {
            success: false,
            code: 403,
            message: `An agency cannot set "${status}". Allowed: ${AGENCY_ALLOWED_STATUSES.join(', ')}`,
          };
        }

        // Origin stages belong to the booking branch, delivery stages to the
        // destination branch (they are the same branch for a local booking).
        if (
          ORIGIN_AGENCY_STATUSES.includes(status) &&
          !this.isOriginAgency(order, actor)
        ) {
          return {
            success: false,
            code: 403,
            message: `Only the booking agency can set "${status}"`,
          };
        }
        if (
          DESTINATION_AGENCY_STATUSES.includes(status) &&
          !this.isDestinationAgency(order, actor)
        ) {
          return {
            success: false,
            code: 403,
            message: `Only the delivery agency can set "${status}"`,
          };
        }
      }
      if (actor.role === 'hub' && !HUB_ALLOWED_STATUSES.includes(status)) {
        return {
          success: false,
          code: 403,
          message: `A hub cannot set "${status}". Allowed: ${HUB_ALLOWED_STATUSES.join(', ')}`,
        };
      }

      if (order.status === status) {
        return { success: false, message: `Order is already in "${status}" status` };
      }

      // Lifecycle moves forward only
      if (statusIndex(status) < statusIndex(order.status)) {
        return {
          success: false,
          message: `Cannot move back from "${order.status}" to "${status}"`,
        };
      }

      // Hub stages need a hub
      if (HUB_DEPENDENT_STATUSES.includes(status) && !order.hub) {
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
      const populated = await ParcelOrder.findById(order._id).populate(POPULATE);

      return {
        success: true,
        message: `Parcel status updated to "${status}"`,
        data: toParcelOrderResponse(populated),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating parcel status',
      };
    }
  }

  // Tracking timeline for a single order
  async getTracking(id: string, actor: ParcelActor): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const order = await ParcelOrder.findById(id).populate(POPULATE);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      const denied = this.assertScope(order, actor);
      if (denied) return denied;

      return {
        success: true,
        data: {
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          currentStatusLabel: statusLabel(order.status),
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
          timeline: order.statusHistory.map((entry: any) => {
            const row = typeof entry.toObject === 'function' ? entry.toObject() : entry;
            return {
              ...row,
              statusLabel: statusLabel(row.status),
              updatedByRole: row.updatedByRole === 'branch' ? 'agency' : row.updatedByRole,
            };
          }),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching tracking details',
      };
    }
  }

  // Delete parcel order (admin only)
  async deleteParcelOrder(id: string, actor: ParcelActor): Promise<ServiceResponse> {
    try {
      if (actor.role !== 'admin') {
        return {
          success: false,
          code: 403,
          message: 'Only admin can delete a parcel order',
        };
      }
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const order = await ParcelOrder.findById(id);
      if (!order) {
        return { success: false, code: 404, message: 'Parcel order not found' };
      }

      // Give the agency its money back before the order disappears
      const reversal = await parcelSettlementService.reverseSettlement(
        id,
        actor,
        'Parcel order deleted'
      );

      if (!reversal.success) {
        return {
          success: false,
          code: reversal.code || 400,
          message: `Order not deleted - the wallet settlement could not be reversed: ${reversal.message}`,
        };
      }

      // Cancel the invoice rather than dropping it, so the numbering stays intact
      const invoice = await invoiceService.cancelForOrder(
        id,
        actor,
        'Parcel order deleted'
      );

      await ParcelOrder.findByIdAndDelete(id);

      return {
        success: true,
        message: `Parcel order deleted successfully. ${reversal.message}.${
          invoice.data ? ` ${invoice.message}` : ''
        }`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting parcel order',
      };
    }
  }
}

export const parcelOrderService = new ParcelOrderService();
