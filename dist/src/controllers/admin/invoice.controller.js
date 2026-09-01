"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelInvoice = exports.updateInvoiceNotes = exports.generateInvoiceForOrder = exports.getInvoiceSummary = exports.getInvoiceByOrder = exports.getInvoiceByNumber = exports.getInvoiceById = exports.getAllInvoices = void 0;
const invoice_service_1 = require("../../services/admin/invoice.service");
const parcelActor_1 = require("../../utils/parcelActor");
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access invoices (or is inactive)',
        });
        return null;
    }
    return actor;
};
const fail = (res, result, fallback = 400) => res.status(result.code || fallback).json({
    success: false,
    message: result.message,
    ...(result.data ? { data: result.data } : {}),
});
/**
 * An agency sees the invoices it raised plus those for parcels addressed to it
 * for delivery (the service widens the scope); a hub sees the invoices for the
 * parcels routed through it; admin sees everything.
 */
const scopeFor = (actor) => {
    if (actor.role === 'agency')
        return { agencyId: actor.agencyId };
    if (actor.role === 'hub')
        return { hubId: actor.hubId };
    return {};
};
const filters = (req) => ({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    agency: (req.query.agency || req.query.branch),
    status: req.query.status,
    invoiceNumber: req.query.invoiceNumber,
    // `orderId` is the name the frontend uses; `order` is accepted too
    order: (req.query.order || req.query.orderId),
    orderNumber: req.query.orderNumber,
    paymentType: req.query.paymentType,
    search: req.query.search,
    dateFrom: (req.query.dateFrom || req.query.date),
    dateTo: (req.query.dateTo || req.query.date),
});
const getAllInvoices = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await invoice_service_1.invoiceService.getAllInvoices(filters(req), scopeFor(actor));
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
exports.getAllInvoices = getAllInvoices;
const getInvoiceById = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await invoice_service_1.invoiceService.getInvoiceById(req.params.id, scopeFor(actor));
        if (!result.success)
            return fail(res, result, 404);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getInvoiceById = getInvoiceById;
const getInvoiceByNumber = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await invoice_service_1.invoiceService.getInvoiceByNumber(req.params.invoiceNumber, scopeFor(actor));
        if (!result.success)
            return fail(res, result, 404);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getInvoiceByNumber = getInvoiceByNumber;
/** The invoice raised for a given parcel order */
const getInvoiceByOrder = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await invoice_service_1.invoiceService.getInvoiceByOrder(req.params.orderId, scopeFor(actor));
        if (!result.success)
            return fail(res, result, 404);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getInvoiceByOrder = getInvoiceByOrder;
const getInvoiceSummary = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const query = filters(req);
        // An agency's summary is always its own, whatever the query says
        if (actor.role === 'agency')
            query.agency = actor.agencyId;
        const result = await invoice_service_1.invoiceService.getSummary(query, scopeFor(actor));
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
exports.getInvoiceSummary = getInvoiceSummary;
/** Raise an invoice for an order that has none (or re-issue a cancelled one) */
const generateInvoiceForOrder = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        // A hub never bills; admin can raise one for any order and an agency only
        // for an order it booked (scopeFor pins it to its own agency id).
        if (actor.role === 'hub') {
            return res.status(403).json({
                success: false,
                message: 'A hub cannot raise invoices',
            });
        }
        const result = await invoice_service_1.invoiceService.createForOrderId(req.params.orderId, actor, scopeFor(actor));
        if (!result.success)
            return fail(res, result);
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.generateInvoiceForOrder = generateInvoiceForOrder;
const updateInvoiceNotes = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        if (actor.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can edit invoice notes',
            });
        }
        const result = await invoice_service_1.invoiceService.updateInvoiceNotes(req.params.id, req.body.notes);
        if (!result.success)
            return fail(res, result, 404);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateInvoiceNotes = updateInvoiceNotes;
const cancelInvoice = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        if (actor.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can cancel an invoice',
            });
        }
        const result = await invoice_service_1.invoiceService.cancelById(req.params.id, actor, req.body?.reason);
        if (!result.success)
            return fail(res, result);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.cancelInvoice = cancelInvoice;
