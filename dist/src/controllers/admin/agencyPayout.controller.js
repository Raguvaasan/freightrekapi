"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAgencyPaymentHistory = exports.getMyAgencyPayout = exports.reverseAgencyPayment = exports.getAgencyPaymentHistory = exports.recordAgencyPayment = exports.getAgencyPayout = exports.getAllAgencyPayouts = void 0;
const agencyPayout_service_1 = require("../../services/admin/agencyPayout.service");
const parcelActor_1 = require("../../utils/parcelActor");
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access agency payouts (or is inactive)',
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
    search: req.query.search,
    status: req.query.status,
    dateFrom: (req.query.dateFrom || req.query.date),
    dateTo: (req.query.dateTo || req.query.date),
});
/** Every agency with what it has earned and what is still owed */
const getAllAgencyPayouts = async (req, res) => {
    try {
        const result = await agencyPayout_service_1.agencyPayoutService.getAllAgencyPayouts(filters(req));
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
exports.getAllAgencyPayouts = getAllAgencyPayouts;
/** One agency's payout page: the four totals plus the order history */
const getAgencyPayout = async (req, res) => {
    try {
        const result = await agencyPayout_service_1.agencyPayoutService.getAgencyPayout(req.params.agencyId, filters(req));
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
exports.getAgencyPayout = getAgencyPayout;
/** The "Pay" button: record a commission payment to the agency */
const recordAgencyPayment = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await agencyPayout_service_1.agencyPayoutService.recordPayment(req.params.agencyId, req.body, actor);
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
exports.recordAgencyPayment = recordAgencyPayment;
const getAgencyPaymentHistory = async (req, res) => {
    try {
        const result = await agencyPayout_service_1.agencyPayoutService.getPaymentHistory(req.params.agencyId, filters(req));
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
exports.getAgencyPaymentHistory = getAgencyPaymentHistory;
const reverseAgencyPayment = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await agencyPayout_service_1.agencyPayoutService.reversePayment(req.params.paymentId, actor, req.body?.reason);
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
exports.reverseAgencyPayment = reverseAgencyPayment;
// ---------------------------------------------------------------- agency self
// The same payout figures, read-only, for the agency that earned them. The
// agency id is never read from the request — it comes from the token, so one
// agency can never ask for another's commission.
const myAgencyId = (req, res) => {
    const agencyId = req.parcelActor?.agencyId;
    if (!agencyId) {
        res.status(403).json({
            success: false,
            message: 'This login is not linked to an agency',
        });
        return null;
    }
    return agencyId;
};
/** This agency's payout details: the four totals plus its order history */
const getMyAgencyPayout = async (req, res) => {
    try {
        const agencyId = myAgencyId(req, res);
        if (!agencyId)
            return;
        const result = await agencyPayout_service_1.agencyPayoutService.getAgencyPayout(agencyId, filters(req));
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
exports.getMyAgencyPayout = getMyAgencyPayout;
/** Commission payments this agency has received */
const getMyAgencyPaymentHistory = async (req, res) => {
    try {
        const agencyId = myAgencyId(req, res);
        if (!agencyId)
            return;
        const result = await agencyPayout_service_1.agencyPayoutService.getPaymentHistory(agencyId, filters(req));
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
exports.getMyAgencyPaymentHistory = getMyAgencyPaymentHistory;
