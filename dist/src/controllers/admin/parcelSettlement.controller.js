"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewSettlement = exports.updateSettlementNotes = exports.reverseSettlement = exports.settleParcelOrder = exports.getSettlementSummary = exports.getSettlementById = exports.getAllSettlements = void 0;
const parcelSettlement_service_1 = require("../../services/admin/parcelSettlement.service");
const parcelOrder_service_1 = require("../../services/admin/parcelOrder.service");
const parcelActor_1 = require("../../utils/parcelActor");
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access the settlement flow (or is inactive)',
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
const filters = (req) => ({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    agency: (req.query.agency || req.query.branch),
    status: req.query.status,
    orderNumber: req.query.orderNumber,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
});
/**
 * A branch may only see its own settlements; admin sees everything.
 */
const scopeFor = (actor) => actor.role === 'agency' ? { agencyId: actor.agencyId } : {};
const getAllSettlements = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelSettlement_service_1.parcelSettlementService.getAllSettlements(filters(req), scopeFor(actor));
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
exports.getAllSettlements = getAllSettlements;
const getSettlementById = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelSettlement_service_1.parcelSettlementService.getSettlementById(req.params.id, scopeFor(actor));
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
exports.getSettlementById = getSettlementById;
const getSettlementSummary = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        // An agency's summary is always its own, whatever the query says
        const query = filters(req);
        if (actor.role === 'agency')
            query.agency = actor.agencyId;
        const result = await parcelSettlement_service_1.parcelSettlementService.getSummary(query);
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
exports.getSettlementSummary = getSettlementSummary;
/** Settle an order that has no active settlement (or re-settle a reversed one) */
const settleParcelOrder = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        if (actor.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can settle a parcel order manually',
            });
        }
        const result = await parcelSettlement_service_1.parcelSettlementService.settleOrderById(req.params.orderId, actor);
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
exports.settleParcelOrder = settleParcelOrder;
/** Refund the booked amount back to the branch (cancelled booking) */
const reverseSettlement = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        if (actor.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can reverse a settlement',
            });
        }
        const result = await parcelSettlement_service_1.parcelSettlementService.reverseSettlementById(req.params.id, actor, req.body?.reason);
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
exports.reverseSettlement = reverseSettlement;
const updateSettlementNotes = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        if (actor.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can edit settlement notes',
            });
        }
        const result = await parcelSettlement_service_1.parcelSettlementService.updateSettlementNotes(req.params.id, req.body.notes);
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
exports.updateSettlementNotes = updateSettlementNotes;
/**
 * What a booking of this amount would cost the branch, before booking it.
 * Query: ?amount=200 (&branch=<id> for admin).
 */
const previewSettlement = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const amount = parseFloat(req.query.amount);
        if (isNaN(amount) || amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid amount query parameter is required',
            });
        }
        const result = await parcelOrder_service_1.parcelOrderService.previewSettlement(amount, actor, (req.query.agency || req.query.branch));
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
exports.previewSettlement = previewSettlement;
