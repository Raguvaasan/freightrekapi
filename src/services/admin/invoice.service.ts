import { Types } from 'mongoose';
import { Invoice } from '../../models/admin/invoice.model';
import { ParcelOrder } from '../../models/admin/parcelOrder.model';
import { Agency } from '../../models/admin/agency.model';
import { ParcelActor } from '../../utils/parcelActor';
import { round2 } from '../../utils/walletLedger';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  code?: number;
}

interface InvoiceListFilters {
  page?: number;
  limit?: number;
  agency?: string;
  status?: string;
  invoiceNumber?: string;
  /** Parcel order id (`order` / `orderId` query param) */
  order?: string;
  orderNumber?: string;
  paymentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Which invoices the caller may see.
 *
 * `agencyId` — the invoices that agency raised plus those addressed to it for
 * delivery. `hubId` — the invoices for parcels routed through that hub; an
 * invoice carries no hub of its own, so the hub is read off the parcel order.
 * Neither set (admin) means every invoice.
 */
export interface InvoiceScope {
  agencyId?: string;
  hubId?: string;
}

const AGENCY_SELECT = 'agencyName agencyOwner phone city state pincode gstNumber type';

const INVOICE_POPULATE = [
  { path: 'agency', select: AGENCY_SELECT },
  { path: 'deliveryAgency', select: AGENCY_SELECT },
  {
    path: 'order',
    // waybill / vehicle come along so an invoice raised before they were
    // snapshotted still shows them from the order it belongs to
    select:
      'orderNumber status paymentType totalAmount pickupAddress deliveryAddress waybill vehicleType vehicleCapacity createdAt',
  },
];

/**
 * Invoices for parcel bookings.
 *
 * One invoice is raised automatically per order at booking time. Every party
 * and amount is snapshotted onto the invoice, so a reprint months later shows
 * exactly what was billed even if the agency or customer record has changed.
 */
export class InvoiceService {
  private buildDateRange(dateFrom?: string, dateTo?: string) {
    const range: any = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) range.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
    }
    return Object.keys(range).length ? range : null;
  }

  /**
   * Invoice numbers run per financial year: INV-2026-27-000123.
   * The sequence is the count of invoices already raised in that year, with a
   * uniqueness loop so a deleted row cannot cause a collision.
   */
  private async generateInvoiceNumber(date: Date = new Date()): Promise<string> {
    // Indian financial year starts in April
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    const label = `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
    const prefix = `INV-${label}-`;

    let seq = (await Invoice.countDocuments({ invoiceNumber: { $regex: `^${prefix}` } })) + 1;
    let invoiceNumber = `${prefix}${String(seq).padStart(6, '0')}`;

    while (await Invoice.exists({ invoiceNumber })) {
      seq += 1;
      invoiceNumber = `${prefix}${String(seq).padStart(6, '0')}`;
    }

    return invoiceNumber;
  }

  private chargesOf(order: any) {
    return {
      transportationCharge: round2(order.transportationCharge || 0),
      loadingChargePercentage: order.loadingChargePercentage || 0,
      loadingCharge: round2(order.loadingCharge || 0),
      miscChargePercentage: order.miscChargePercentage || 0,
      miscellaneousCharge: round2(order.miscellaneousCharge || 0),
      totalAmount: round2(order.totalAmount || 0),
    };
  }

  /**
   * Raise the invoice for a booking. Called automatically on order creation;
   * also usable for orders booked before invoicing existed.
   */
  async createForOrder(
    order: any,
    actor: ParcelActor,
    options: { agency?: any; deliveryAgency?: any } = {}
  ): Promise<ServiceResponse> {
    try {
      const existing = await Invoice.findOne({ order: order._id });
      if (existing && existing.status === 'issued') {
        return {
          success: false,
          code: 409,
          message: `Invoice ${existing.invoiceNumber} already exists for order ${order.orderNumber}`,
          data: existing,
        };
      }

      const agencyId = order.agency?._id
        ? order.agency._id.toString()
        : order.agency.toString();

      const agency = options.agency || (await Agency.findById(agencyId));
      if (!agency) {
        return { success: false, message: 'Booking agency not found' };
      }

      const destId = order.deliveryCustomer?.deliveryAgency?._id
        ? order.deliveryCustomer.deliveryAgency._id.toString()
        : order.deliveryCustomer?.deliveryAgency?.toString();

      const deliveryAgency =
        options.deliveryAgency || (destId ? await Agency.findById(destId) : null);

      const payload = {
        order: order._id,
        orderNumber: order.orderNumber,
        agency: agency._id,
        deliveryAgency: deliveryAgency?._id,
        invoiceDate: new Date(),
        issuedByAgency: {
          name: agency.agencyName,
          mobileNumber: agency.phone,
          address: agency.address,
          gstNumber: agency.gstNumber,
          agencyName: agency.agencyName,
          city: agency.city,
          state: agency.state,
          pincode: agency.pincode,
        },
        billTo: {
          name: order.bookingCustomer?.name,
          mobileNumber: order.bookingCustomer?.mobileNumber,
          address: order.bookingCustomer?.address,
          gstNumber: order.bookingCustomer?.gstNumber,
        },
        shipTo: {
          name: order.deliveryCustomer?.name,
          mobileNumber: order.deliveryCustomer?.mobileNumber,
          address: order.deliveryCustomer?.address,
          gstNumber: order.deliveryCustomer?.gstNumber,
          agencyName: deliveryAgency?.agencyName,
          city: deliveryAgency?.city,
          state: deliveryAgency?.state,
          pincode: deliveryAgency?.pincode,
        },
        pickupAddress: order.pickupAddress,
        deliveryAddress: order.deliveryAddress,
        parcelDetails: {
          article: order.parcelDetails?.article,
          remarks: order.parcelDetails?.remarks,
          numberOfParcels: order.parcelDetails?.numberOfParcels,
          approximateValue: order.parcelDetails?.approximateValue,
        },
        waybill: order.waybill,
        vehicleType: order.vehicleType,
        vehicleCapacity: order.vehicleCapacity,
        charges: this.chargesOf(order),
        paymentType: order.paymentType,
        status: 'issued' as const,
      };

      // A cancelled invoice is re-issued in place with a fresh number
      const invoice = existing
        ? await Invoice.findByIdAndUpdate(
            existing._id,
            {
              $set: { ...payload, invoiceNumber: await this.generateInvoiceNumber() },
              $unset: { cancelledAt: '', cancelledBy: '', cancelReason: '' },
            },
            { new: true }
          )
        : await Invoice.create({
            ...payload,
            invoiceNumber: await this.generateInvoiceNumber(),
          });

      return {
        success: true,
        message: `Invoice ${invoice!.invoiceNumber} created`,
        data: invoice,
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        return {
          success: false,
          code: 409,
          message: 'An invoice already exists for this order',
        };
      }
      return {
        success: false,
        message: error.message || 'Error creating invoice',
      };
    }
  }

  /** Keep the invoice in step when the charges are revised */
  async syncCharges(
    order: any,
    actor: ParcelActor,
    note?: string
  ): Promise<ServiceResponse> {
    try {
      const invoice = await Invoice.findOne({ order: order._id, status: 'issued' });
      if (!invoice) {
        return { success: true, message: 'No issued invoice to update', data: null };
      }

      const previousTotal = invoice.charges.totalAmount;
      const charges = this.chargesOf(order);

      if (round2(previousTotal) === charges.totalAmount) {
        return { success: true, message: 'Invoice total unchanged', data: invoice };
      }

      invoice.charges = charges as any;
      invoice.revisions.push({
        previousTotal: round2(previousTotal),
        newTotal: charges.totalAmount,
        revisedBy: actor.id,
        note,
        revisedAt: new Date(),
      });
      await invoice.save();

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} updated to ₹${charges.totalAmount}`,
        data: invoice,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating the invoice',
      };
    }
  }

  /**
   * Re-snapshot the customer / parcel details after the booking was edited.
   * Charges are handled separately by `syncCharges`.
   */
  async refreshPartiesForOrder(order: any, actor: ParcelActor): Promise<ServiceResponse> {
    try {
      if (!order) return { success: true, message: 'No order given', data: null };

      const invoice = await Invoice.findOne({ order: order._id, status: 'issued' });
      if (!invoice) {
        return { success: true, message: 'No issued invoice to update', data: null };
      }

      const dest: any = order.deliveryCustomer?.deliveryAgency;
      const destAgency = dest?.agencyName
        ? dest
        : dest
          ? await Agency.findById(dest._id || dest)
          : null;

      invoice.billTo = {
        name: order.bookingCustomer?.name,
        mobileNumber: order.bookingCustomer?.mobileNumber,
        address: order.bookingCustomer?.address,
        gstNumber: order.bookingCustomer?.gstNumber,
      } as any;

      invoice.shipTo = {
        name: order.deliveryCustomer?.name,
        mobileNumber: order.deliveryCustomer?.mobileNumber,
        address: order.deliveryCustomer?.address,
        gstNumber: order.deliveryCustomer?.gstNumber,
        agencyName: destAgency?.agencyName,
        city: destAgency?.city,
        state: destAgency?.state,
        pincode: destAgency?.pincode,
      } as any;

      // The destination agency can be changed until the parcel leaves the hub
      if (destAgency?._id) invoice.deliveryAgency = destAgency._id;

      invoice.pickupAddress = order.pickupAddress;
      invoice.deliveryAddress = order.deliveryAddress;

      invoice.parcelDetails = {
        article: order.parcelDetails?.article,
        remarks: order.parcelDetails?.remarks,
        numberOfParcels: order.parcelDetails?.numberOfParcels,
        approximateValue: order.parcelDetails?.approximateValue,
      };

      invoice.waybill = order.waybill;
      invoice.vehicleType = order.vehicleType;
      invoice.vehicleCapacity = order.vehicleCapacity;

      invoice.paymentType = order.paymentType;
      await invoice.save();

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} details refreshed`,
        data: invoice,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error refreshing the invoice',
      };
    }
  }

  /** Cancel the invoice for an order (order cancelled or deleted) */
  async cancelForOrder(
    orderId: string,
    actor: ParcelActor,
    reason?: string
  ): Promise<ServiceResponse> {
    try {
      if (!orderId || !Types.ObjectId.isValid(orderId)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const invoice = await Invoice.findOne({ order: orderId });
      if (!invoice) {
        return { success: true, message: 'No invoice for this order', data: null };
      }
      if (invoice.status === 'cancelled') {
        return { success: true, message: 'Invoice already cancelled', data: invoice };
      }

      invoice.status = 'cancelled';
      invoice.cancelledAt = new Date();
      invoice.cancelledBy = actor.id;
      invoice.cancelReason = reason;
      await invoice.save();

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} cancelled`,
        data: invoice,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error cancelling the invoice',
      };
    }
  }

  async cancelById(
    id: string,
    actor: ParcelActor,
    reason?: string
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid invoice ID' };
      }

      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return { success: false, code: 404, message: 'Invoice not found' };
      }
      if (invoice.status === 'cancelled') {
        return {
          success: false,
          code: 409,
          message: `Invoice ${invoice.invoiceNumber} is already cancelled`,
        };
      }

      invoice.status = 'cancelled';
      invoice.cancelledAt = new Date();
      invoice.cancelledBy = actor.id;
      invoice.cancelReason = reason;
      await invoice.save();

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} cancelled`,
        data: invoice,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error cancelling the invoice',
      };
    }
  }

  /** Raise an invoice for an existing order by id (retro / re-issue) */
  async createForOrderId(
    orderId: string,
    actor: ParcelActor,
    scope: InvoiceScope = {}
  ): Promise<ServiceResponse> {
    if (!Types.ObjectId.isValid(orderId)) {
      return { success: false, message: 'Invalid order ID' };
    }

    const order = await ParcelOrder.findById(orderId);
    if (!order) {
      return { success: false, code: 404, message: 'Parcel order not found' };
    }

    // An agency may only raise an invoice against an order it booked
    if (scope.agencyId && order.agency?.toString() !== scope.agencyId) {
      return {
        success: false,
        code: 403,
        message: 'This parcel order was not booked at your agency',
      };
    }

    return this.createForOrder(order, actor);
  }

  async getAllInvoices(
    filters: InvoiceListFilters,
    scope: InvoiceScope = {}
  ): Promise<ServiceResponse> {
    try {
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const skip = (page - 1) * limit;

      const query: any = {};
      // Both the agency scope and the search build an $or, so they are combined
      // under $and rather than overwriting one another
      const and: any[] = [];

      // Cast to an ObjectId rather than leaving the id a string: the same query
      // is reused as an aggregation $match below, and $match does no schema
      // casting — a string id there matches nothing and the totals come back
      // as zeros while the list itself looks right.
      // A hub sees the invoices for the parcels routed through it
      if (scope.hubId) {
        if (!Types.ObjectId.isValid(scope.hubId)) {
          return { success: false, message: 'Invalid hub ID' };
        }
        and.push({ order: { $in: await this.orderIdsForHub(scope.hubId) } });
      }

      const agencyId = scope.agencyId || filters.agency;
      if (agencyId) {
        if (!Types.ObjectId.isValid(agencyId)) {
          return { success: false, message: 'Invalid agency ID' };
        }
        const oid = new Types.ObjectId(agencyId);
        // An agency login sees what it billed *and* what is addressed to it for
        // delivery — otherwise an incoming parcel's invoice reads as empty on
        // the destination agency's screen. An admin filtering by `agency`
        // means the billing agency, as before.
        and.push(
          scope.agencyId ? { $or: [{ agency: oid }, { deliveryAgency: oid }] } : { agency: oid }
        );
      }

      if (filters.status) query.status = filters.status;
      if (filters.paymentType) query.paymentType = filters.paymentType;
      // Filter down to a single parcel order (one invoice per order)
      if (filters.order) {
        if (!Types.ObjectId.isValid(filters.order)) {
          return { success: false, message: 'Invalid order ID' };
        }
        query.order = new Types.ObjectId(filters.order);
      }
      if (filters.invoiceNumber) {
        query.invoiceNumber = { $regex: filters.invoiceNumber, $options: 'i' };
      }
      if (filters.orderNumber) {
        query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
      }
      if (filters.search) {
        and.push({
          $or: [
            { invoiceNumber: { $regex: filters.search, $options: 'i' } },
            { orderNumber: { $regex: filters.search, $options: 'i' } },
            { 'billTo.name': { $regex: filters.search, $options: 'i' } },
            { 'billTo.mobileNumber': { $regex: filters.search, $options: 'i' } },
            { 'shipTo.name': { $regex: filters.search, $options: 'i' } },
            { 'billTo.gstNumber': { $regex: filters.search, $options: 'i' } },
          ],
        });
      }

      const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
      if (range) query.invoiceDate = range;

      if (and.length) query.$and = and;

      const [invoices, total, totals] = await Promise.all([
        Invoice.find(query)
          .populate(INVOICE_POPULATE)
          .sort({ invoiceDate: -1 })
          .skip(skip)
          .limit(limit),
        Invoice.countDocuments(query),
        Invoice.aggregate([
          { $match: { ...query, status: 'issued' } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalTransportation: { $sum: '$charges.transportationCharge' },
              totalLoading: { $sum: '$charges.loadingCharge' },
              totalMiscellaneous: { $sum: '$charges.miscellaneousCharge' },
              totalAmount: { $sum: '$charges.totalAmount' },
            },
          },
        ]),
      ]);

      const summary = totals[0] || {
        count: 0,
        totalTransportation: 0,
        totalLoading: 0,
        totalMiscellaneous: 0,
        totalAmount: 0,
      };

      return {
        success: true,
        data: {
          invoices,
          totals: {
            issuedCount: summary.count,
            totalTransportation: round2(summary.totalTransportation),
            totalLoading: round2(summary.totalLoading),
            totalMiscellaneous: round2(summary.totalMiscellaneous),
            totalAmount: round2(summary.totalAmount),
          },
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching invoices',
      };
    }
  }

  /**
   * The parcel orders assigned to a hub.
   *
   * An invoice records the two agencies, never the hub, so a hub's invoices can
   * only be found through the orders it is handling.
   */
  private async orderIdsForHub(hubId: string): Promise<Types.ObjectId[]> {
    return ParcelOrder.find({ hub: new Types.ObjectId(hubId) }).distinct('_id');
  }

  /**
   * An agency may read the invoice it raised and the one for a parcel addressed
   * to it — the destination agency has to be able to print what it is
   * delivering. A hub may read the invoice for any parcel routed through it.
   * Writes stay with the booking agency (and admin).
   */
  private async scopeCheck(
    invoice: any,
    scope: InvoiceScope
  ): Promise<ServiceResponse | null> {
    const idOf = (ref: any) => (ref?._id ? ref._id.toString() : ref?.toString());

    if (scope.hubId) {
      const order = await ParcelOrder.findById(idOf(invoice.order))
        .select('hub')
        .lean();

      if (idOf(order?.hub) === scope.hubId) return null;

      return {
        success: false,
        code: 403,
        message: 'This invoice is for a parcel that is not assigned to your hub',
      };
    }

    if (!scope.agencyId) return null;

    if (idOf(invoice.agency) === scope.agencyId) return null;
    if (idOf(invoice.deliveryAgency) === scope.agencyId) return null;

    // Invoices raised before `deliveryAgency` was snapshotted carry it only on
    // the order, so look there before refusing
    if (!invoice.deliveryAgency) {
      const order = await ParcelOrder.findById(idOf(invoice.order))
        .select('deliveryCustomer.deliveryAgency')
        .lean();
      if (idOf(order?.deliveryCustomer?.deliveryAgency) === scope.agencyId) return null;
    }

    return {
      success: false,
      code: 403,
      message: 'This invoice belongs to another agency',
    };
  }

  async getInvoiceById(
    id: string,
    scope: InvoiceScope = {}
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid invoice ID' };
      }

      const invoice = await Invoice.findById(id).populate(INVOICE_POPULATE);
      if (!invoice) {
        return { success: false, code: 404, message: 'Invoice not found' };
      }

      const denied = await this.scopeCheck(invoice, scope);
      if (denied) return denied;

      return { success: true, data: invoice };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching the invoice',
      };
    }
  }

  async getInvoiceByNumber(
    invoiceNumber: string,
    scope: InvoiceScope = {}
  ): Promise<ServiceResponse> {
    try {
      const invoice = await Invoice.findOne({ invoiceNumber }).populate(INVOICE_POPULATE);
      if (!invoice) {
        return { success: false, code: 404, message: 'Invoice not found' };
      }

      const denied = await this.scopeCheck(invoice, scope);
      if (denied) return denied;

      return { success: true, data: invoice };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching the invoice',
      };
    }
  }

  /**
   * Invoice summaries for a page of parcel orders, keyed by order id.
   * One query for the whole page, so a listing can show the invoice without
   * the client calling /invoice/order/:orderId per row.
   */
  async getInvoiceSummariesByOrders(
    orderIds: any[]
  ): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    if (!orderIds.length) return map;

    const invoices = await Invoice.find({ order: { $in: orderIds } }).select(
      'order invoiceNumber invoiceDate status charges.totalAmount'
    );

    for (const invoice of invoices) {
      map.set(String(invoice.order), {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        status: invoice.status,
        totalAmount: invoice.charges?.totalAmount ?? 0,
      });
    }
    return map;
  }

  async getInvoiceByOrder(
    orderId: string,
    scope: InvoiceScope = {}
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        return { success: false, message: 'Invalid order ID' };
      }

      const invoice = await Invoice.findOne({ order: orderId }).populate(INVOICE_POPULATE);
      if (!invoice) {
        return { success: false, code: 404, message: 'No invoice for this order' };
      }

      const denied = await this.scopeCheck(invoice, scope);
      if (denied) return denied;

      return { success: true, data: invoice };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching the invoice',
      };
    }
  }

  async updateInvoiceNotes(id: string, notes: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return { success: false, message: 'Invalid invoice ID' };
      }

      const invoice = await Invoice.findByIdAndUpdate(
        id,
        { $set: { notes } },
        { new: true }
      ).populate(INVOICE_POPULATE);

      if (!invoice) {
        return { success: false, code: 404, message: 'Invoice not found' };
      }

      return {
        success: true,
        message: 'Invoice notes updated successfully',
        data: invoice,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating the invoice',
      };
    }
  }

  /** Billing summary, overall and per agency */
  async getSummary(
    filters: InvoiceListFilters,
    scope: InvoiceScope = {}
  ): Promise<ServiceResponse> {
    try {
      const match: any = { status: 'issued' };

      if (filters.agency && Types.ObjectId.isValid(filters.agency)) {
        match.agency = new Types.ObjectId(filters.agency);
      }

      // A hub's summary covers the parcels routed through it
      if (scope.hubId) {
        if (!Types.ObjectId.isValid(scope.hubId)) {
          return { success: false, message: 'Invalid hub ID' };
        }
        match.order = { $in: await this.orderIdsForHub(scope.hubId) };
      }

      const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
      if (range) match.invoiceDate = range;

      const [overall, perAgency] = await Promise.all([
        Invoice.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              invoices: { $sum: 1 },
              totalTransportation: { $sum: '$charges.transportationCharge' },
              totalLoading: { $sum: '$charges.loadingCharge' },
              totalMiscellaneous: { $sum: '$charges.miscellaneousCharge' },
              totalAmount: { $sum: '$charges.totalAmount' },
            },
          },
        ]),
        Invoice.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$agency',
              invoices: { $sum: 1 },
              totalAmount: { $sum: '$charges.totalAmount' },
            },
          },
          {
            $lookup: {
              from: 'agencies',
              localField: '_id',
              foreignField: '_id',
              as: 'agency',
            },
          },
          { $unwind: { path: '$agency', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              agencyId: '$_id',
              agencyName: '$agency.agencyName',
              type: '$agency.type',
              agencyType: { $eq: ['$agency.type', 'Own'] },
              invoices: 1,
              totalAmount: { $round: ['$totalAmount', 2] },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),
      ]);

      const totals = overall[0] || {
        invoices: 0,
        totalTransportation: 0,
        totalLoading: 0,
        totalMiscellaneous: 0,
        totalAmount: 0,
      };

      const cancelled = await Invoice.aggregate([
        { $match: { ...match, status: 'cancelled' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]);

      return {
        success: true,
        data: {
          issuedInvoices: totals.invoices,
          totalTransportation: round2(totals.totalTransportation),
          totalLoading: round2(totals.totalLoading),
          totalMiscellaneous: round2(totals.totalMiscellaneous),
          totalAmount: round2(totals.totalAmount),
          cancelledInvoices: cancelled[0]?.count || 0,
          perAgency,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error building the invoice summary',
      };
    }
  }
}

export const invoiceService = new InvoiceService();
