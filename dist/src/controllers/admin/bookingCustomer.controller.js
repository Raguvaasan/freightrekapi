"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingCustomer = exports.getAllBookingCustomers = void 0;
const bookingCustomer_service_1 = require("../../services/admin/bookingCustomer.service");
const parcelActor_1 = require("../../utils/parcelActor");
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access customers (or is inactive)',
        });
        return null;
    }
    return actor;
};
const fail = (res, result, fallback = 400) => res.status(result.code || fallback).json({
    success: false,
    message: result.message,
});
const filters = (req) => ({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search,
    agency: (req.query.agency || req.query.branch),
    paymentType: req.query.paymentType,
    dateFrom: (req.query.dateFrom || req.query.date),
    dateTo: (req.query.dateTo || req.query.date),
    sortBy: req.query.sortBy,
});
/** Customer Management: every customer who has booked a parcel */
const getAllBookingCustomers = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await bookingCustomer_service_1.bookingCustomerService.getAllBookingCustomers(filters(req), actor);
        if (!result.success)
            return fail(res, result);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAllBookingCustomers = getAllBookingCustomers;
/** One customer's details and every order they have placed */
const getBookingCustomer = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await bookingCustomer_service_1.bookingCustomerService.getBookingCustomer(req.params.mobileNumber, filters(req), actor);
        if (!result.success)
            return fail(res, result);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getBookingCustomer = getBookingCustomer;
