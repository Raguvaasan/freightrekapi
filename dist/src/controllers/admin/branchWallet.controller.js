"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyBranchWalletTransactions = exports.getMyBranchWallet = exports.getAdminWalletTransactions = exports.getAdminWallet = exports.reverseWalletTransaction = exports.updateWalletTransaction = exports.getWalletTransaction = exports.getBranchWalletTransactions = exports.debitBranchWallet = exports.creditBranchWallet = exports.updateBranchPercentages = exports.getBranchWallet = exports.getAllBranchWallets = void 0;
const branchWallet_service_1 = require("../../services/admin/branchWallet.service");
const parcelActor_1 = require("../../utils/parcelActor");
/**
 * Branch wallet endpoints.
 *
 * The admin route group manages every branch's wallet; the branch route group
 * exposes the same data read-only, scoped to the caller's own branch.
 */
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access the wallet flow (or is inactive)',
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
const listFilters = (req) => ({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    type: req.query.type,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
});
// ---------------------------------------------------------------- admin side
const getAllBranchWallets = async (req, res) => {
    try {
        const result = await branchWallet_service_1.branchWalletService.getAllBranchWallets({
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search,
            status: req.query.status,
        });
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
exports.getAllBranchWallets = getAllBranchWallets;
const getBranchWallet = async (req, res) => {
    try {
        const result = await branchWallet_service_1.branchWalletService.getBranchWallet(req.params.branchId, 
        // Admin route: the charge percentages are reported here and nowhere else
        { includeChargePercentages: true });
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
exports.getBranchWallet = getBranchWallet;
/** Admin sets the commission / loading / miscellaneous percentages */
const updateBranchPercentages = async (req, res) => {
    try {
        const { profitPercentage, loadingChargePercentage, miscChargePercentage } = req.body;
        const result = await branchWallet_service_1.branchWalletService.updatePercentages(req.params.branchId, { profitPercentage, loadingChargePercentage, miscChargePercentage });
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
exports.updateBranchPercentages = updateBranchPercentages;
const creditBranchWallet = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const { amount, remarks, paymentMethod, reference } = req.body;
        const result = await branchWallet_service_1.branchWalletService.creditBranchWallet(req.params.branchId, { amount, remarks, paymentMethod, reference }, actor);
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
exports.creditBranchWallet = creditBranchWallet;
const debitBranchWallet = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const { amount, remarks, paymentMethod, reference } = req.body;
        const result = await branchWallet_service_1.branchWalletService.debitBranchWallet(req.params.branchId, { amount, remarks, paymentMethod, reference }, actor);
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
exports.debitBranchWallet = debitBranchWallet;
const getBranchWalletTransactions = async (req, res) => {
    try {
        const result = await branchWallet_service_1.branchWalletService.getBranchTransactions(req.params.branchId, listFilters(req));
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
exports.getBranchWalletTransactions = getBranchWalletTransactions;
const getWalletTransaction = async (req, res) => {
    try {
        const result = await branchWallet_service_1.branchWalletService.getTransactionById(req.params.transactionId);
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
exports.getWalletTransaction = getWalletTransaction;
const updateWalletTransaction = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await branchWallet_service_1.branchWalletService.updateTransactionRemarks(req.params.transactionId, req.body.remarks, actor);
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
exports.updateWalletTransaction = updateWalletTransaction;
const reverseWalletTransaction = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await branchWallet_service_1.branchWalletService.reverseTransaction(req.params.transactionId, actor, req.body?.reason);
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
exports.reverseWalletTransaction = reverseWalletTransaction;
const getAdminWallet = async (_req, res) => {
    try {
        const result = await branchWallet_service_1.branchWalletService.getAdminWallet();
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
exports.getAdminWallet = getAdminWallet;
const getAdminWalletTransactions = async (req, res) => {
    try {
        const result = await branchWallet_service_1.branchWalletService.getAdminTransactions(listFilters(req));
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
exports.getAdminWalletTransactions = getAdminWalletTransactions;
// --------------------------------------------------------------- branch side
/** The logged-in branch's own wallet */
const getMyBranchWallet = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor?.agencyId) {
            return res.status(403).json({ success: false, message: 'Branch access required' });
        }
        const result = await branchWallet_service_1.branchWalletService.getBranchWallet(actor.agencyId);
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
exports.getMyBranchWallet = getMyBranchWallet;
/** The logged-in branch's own wallet statement */
const getMyBranchWalletTransactions = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor?.agencyId) {
            return res.status(403).json({ success: false, message: 'Branch access required' });
        }
        const result = await branchWallet_service_1.branchWalletService.getBranchTransactions(actor.agencyId, listFilters(req));
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
exports.getMyBranchWalletTransactions = getMyBranchWalletTransactions;
