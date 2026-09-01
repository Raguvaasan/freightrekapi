"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingCustomerService = exports.BookingCustomerService = void 0;
const mongoose_1 = require("mongoose");
const parcelOrder_model_1 = require("../../models/admin/parcelOrder.model");
const agency_model_1 = require("../../models/admin/agency.model");
const walletLedger_1 = require("../../utils/walletLedger");
const parcelOrder_service_1 = require("./parcelOrder.service");
const SORTS = {
    recent: { lastOrderDate: -1 },
    orders: { totalOrders: -1, lastOrderDate: -1 },
    amount: { totalAmount: -1, lastOrderDate: -1 },
    name: { name: 1 },
};
/**
 * Customer Management — the people who book parcels.
 *
 * A booking customer has no record of its own: the name, mobile number, address
 * and GST are captured on each parcel order as `bookingCustomer`. So a customer
 * here is every booking that shares a MOBILE NUMBER, rolled up — the mobile
 * number is the identity, and it is what /{mobileNumber} takes.
 *
 * The name, address and GST shown are the ones from the customer's most recent
 * booking, since that is the freshest thing anyone typed. Where the latest
 * booking left the address or GST blank, any other value recorded for the same
 * number is used rather than showing nothing.
 */
class BookingCustomerService {
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
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo))
                    to.setHours(23, 59, 59, 999);
                range.$lte = to;
            }
        }
        return Object.keys(range).length ? range : null;
    }
    /** Which parcel orders the roll-up is built from */
    buildMatch(filters) {
        const match = {};
        if (filters.search) {
            const like = { $regex: filters.search, $options: 'i' };
            match.$or = [
                { 'bookingCustomer.name': like },
                { 'bookingCustomer.mobileNumber': like },
                { 'bookingCustomer.gstNumber': like },
            ];
        }
        if (filters.agency && mongoose_1.Types.ObjectId.isValid(filters.agency)) {
            match.agency = new mongoose_1.Types.ObjectId(filters.agency);
        }
        if (filters.paymentType)
            match.paymentType = filters.paymentType;
        const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
        if (range)
            match.createdAt = range;
        return match;
    }
    /**
     * One row per mobile number. Fed by a `$sort: { createdAt: -1 }` so `$first`
     * is the customer's latest booking and `$last` their first.
     */
    groupStage() {
        return {
            $group: {
                _id: '$bookingCustomer.mobileNumber',
                name: { $first: '$bookingCustomer.name' },
                address: { $first: '$bookingCustomer.address' },
                gstNumber: { $first: '$bookingCustomer.gstNumber' },
                // Fallbacks for a latest booking that left them blank
                addresses: { $addToSet: '$bookingCustomer.address' },
                gstNumbers: { $addToSet: '$bookingCustomer.gstNumber' },
                totalOrders: { $sum: 1 },
                totalParcels: { $sum: '$parcelDetails.numberOfParcels' },
                transportationCharge: { $sum: '$transportationCharge' },
                loadingCharge: { $sum: '$loadingCharge' },
                miscellaneousCharge: { $sum: '$miscellaneousCharge' },
                totalAmount: { $sum: '$totalAmount' },
                // What the customer has settled vs what is still on them
                paidAmount: {
                    $sum: { $cond: [{ $eq: ['$paymentType', 'Paid'] }, '$totalAmount', 0] },
                },
                outstandingAmount: {
                    $sum: {
                        $cond: [{ $in: ['$paymentType', ['To Pay', 'Credit']] }, '$totalAmount', 0],
                    },
                },
                paidOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentType', 'Paid'] }, 1, 0] },
                },
                toPayOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentType', 'To Pay'] }, 1, 0] },
                },
                creditOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentType', 'Credit'] }, 1, 0] },
                },
                deliveredOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
                },
                firstOrderDate: { $last: '$createdAt' },
                lastOrderDate: { $first: '$createdAt' },
                lastOrderNumber: { $first: '$orderNumber' },
                lastOrderStatus: { $first: '$status' },
                agencies: { $addToSet: '$agency' },
            },
        };
    }
    /** The first non-empty value recorded for the customer */
    firstFilled(latest, others = []) {
        return latest || others.find((value) => !!value && value.trim() !== '') || null;
    }
    shapeRow(row, agencyNames) {
        const delivered = row.deliveredOrders || 0;
        return {
            mobileNumber: row._id,
            name: row.name,
            address: this.firstFilled(row.address, row.addresses),
            gstNumber: this.firstFilled(row.gstNumber, row.gstNumbers),
            totalOrders: row.totalOrders,
            totalParcels: row.totalParcels || 0,
            deliveredOrders: delivered,
            /** Booked and not delivered yet */
            pendingOrders: row.totalOrders - delivered,
            transportationCharge: (0, walletLedger_1.round2)(row.transportationCharge || 0),
            loadingCharge: (0, walletLedger_1.round2)(row.loadingCharge || 0),
            miscellaneousCharge: (0, walletLedger_1.round2)(row.miscellaneousCharge || 0),
            totalAmount: (0, walletLedger_1.round2)(row.totalAmount || 0),
            paidAmount: (0, walletLedger_1.round2)(row.paidAmount || 0),
            outstandingAmount: (0, walletLedger_1.round2)(row.outstandingAmount || 0),
            ordersByPaymentType: {
                Paid: row.paidOrders || 0,
                'To Pay': row.toPayOrders || 0,
                Credit: row.creditOrders || 0,
            },
            firstOrderDate: row.firstOrderDate,
            lastOrderDate: row.lastOrderDate,
            lastOrderNumber: row.lastOrderNumber,
            lastOrderStatus: row.lastOrderStatus,
            // Where this customer books
            agencies: (row.agencies || [])
                .filter(Boolean)
                .map((id) => agencyNames.get(String(id)))
                .filter(Boolean),
            currency: 'INR',
        };
    }
    /** Agency name/city for every id the rows mention, in one query */
    async agencyNamesFor(rows) {
        const ids = [
            ...new Set(rows.flatMap((row) => (row.agencies || []).filter(Boolean).map(String))),
        ];
        if (!ids.length)
            return new Map();
        const agencies = await agency_model_1.Agency.find({ _id: { $in: ids } })
            .select('agencyName city state')
            .lean();
        return new Map(agencies.map((agency) => [
            String(agency._id),
            {
                agencyId: String(agency._id),
                agencyName: agency.agencyName,
                city: agency.city,
                state: agency.state,
            },
        ]));
    }
    /** Every booking customer, one row each, with what they have booked */
    async getAllBookingCustomers(filters, actor) {
        try {
            const page = filters.page && filters.page > 0 ? filters.page : 1;
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
            const skip = (page - 1) * limit;
            const match = this.buildMatch(filters);
            // An agency only ever sees the customers who booked with it
            if (actor.role === 'agency' && actor.agencyId) {
                match.agency = new mongoose_1.Types.ObjectId(actor.agencyId);
            }
            const sort = SORTS[filters.sortBy || 'recent'] || SORTS.recent;
            const [result] = await parcelOrder_model_1.ParcelOrder.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                this.groupStage(),
                { $sort: sort },
                {
                    $facet: {
                        rows: [{ $skip: skip }, { $limit: limit }],
                        count: [{ $count: 'total' }],
                        totals: [
                            {
                                $group: {
                                    _id: null,
                                    customers: { $sum: 1 },
                                    totalOrders: { $sum: '$totalOrders' },
                                    totalAmount: { $sum: '$totalAmount' },
                                    paidAmount: { $sum: '$paidAmount' },
                                    outstandingAmount: { $sum: '$outstandingAmount' },
                                },
                            },
                        ],
                    },
                },
            ]);
            const rows = result?.rows || [];
            const total = result?.count?.[0]?.total || 0;
            const sums = result?.totals?.[0] || {};
            const agencyNames = await this.agencyNamesFor(rows);
            return {
                success: true,
                data: {
                    customers: rows.map((row, index) => ({
                        serialNo: skip + index + 1,
                        ...this.shapeRow(row, agencyNames),
                    })),
                    // Across every customer matching the filters, not just this page
                    totals: {
                        customers: sums.customers || 0,
                        totalOrders: sums.totalOrders || 0,
                        totalAmount: (0, walletLedger_1.round2)(sums.totalAmount || 0),
                        paidAmount: (0, walletLedger_1.round2)(sums.paidAmount || 0),
                        outstandingAmount: (0, walletLedger_1.round2)(sums.outstandingAmount || 0),
                        currency: 'INR',
                    },
                    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching booking customers',
            };
        }
    }
    /**
     * One customer and every order they have placed.
     *
     * `summary` is the customer's lifetime position and ignores the date /
     * payment-type filters, so the profile does not change as the order list is
     * filtered; `totals` alongside `orders` is the filtered set. The orders come
     * back in exactly the shape the parcel list screen uses, invoice included.
     */
    async getBookingCustomer(mobileNumber, filters, actor) {
        try {
            const mobile = (mobileNumber || '').trim();
            if (!mobile) {
                return { success: false, message: 'Mobile number is required' };
            }
            const scope = { 'bookingCustomer.mobileNumber': mobile };
            if (actor.role === 'agency' && actor.agencyId) {
                scope.agency = new mongoose_1.Types.ObjectId(actor.agencyId);
            }
            else if (filters.agency && mongoose_1.Types.ObjectId.isValid(filters.agency)) {
                scope.agency = new mongoose_1.Types.ObjectId(filters.agency);
            }
            const [profile] = await parcelOrder_model_1.ParcelOrder.aggregate([
                { $match: scope },
                { $sort: { createdAt: -1 } },
                this.groupStage(),
            ]);
            if (!profile) {
                return {
                    success: false,
                    code: 404,
                    message: `No bookings found for ${mobile}`,
                };
            }
            const agencyNames = await this.agencyNamesFor([profile]);
            const shaped = this.shapeRow(profile, agencyNames);
            const { mobileNumber: customerMobile, name, address, gstNumber, firstOrderDate, lastOrderDate, lastOrderNumber, lastOrderStatus, agencies, ...summary } = shaped;
            // The order history, reusing the parcel list so the rows match that screen
            const orders = await parcelOrder_service_1.parcelOrderService.getAllParcelOrders({
                page: filters.page,
                limit: filters.limit,
                agency: filters.agency,
                paymentType: filters.paymentType,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                bookingCustomerMobile: mobile,
                // An agency's list is what it BOOKED, matching the roll-up above.
                // Without this it would also pick up bookings made elsewhere and
                // merely addressed to it, and the summary would not add up.
                direction: 'outgoing',
            }, actor);
            if (!orders.success)
                return orders;
            return {
                success: true,
                data: {
                    customer: {
                        mobileNumber: customerMobile,
                        name,
                        address,
                        gstNumber,
                        firstOrderDate,
                        lastOrderDate,
                        lastOrderNumber,
                        lastOrderStatus,
                        agencies,
                    },
                    // Lifetime, whatever the order list is filtered to
                    summary,
                    ...orders.data,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Error fetching the booking customer',
            };
        }
    }
}
exports.BookingCustomerService = BookingCustomerService;
exports.bookingCustomerService = new BookingCustomerService();
