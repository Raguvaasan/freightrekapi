"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParcelOrder = exports.getParcelTracking = exports.updateParcelStatus = exports.updateTransportationCharge = exports.getDriverOptions = exports.getVehicleOptions = exports.getDeliveryAgencyOptions = exports.assignVehicleAndDriver = exports.assignHub = exports.updateParcelOrder = exports.getParcelOrderById = exports.getInwardParcelOrders = exports.getOutwardParcelOrders = exports.getAllParcelOrders = exports.createParcelOrder = void 0;
const parcelOrder_service_1 = require("../../services/admin/parcelOrder.service");
const parcelActor_1 = require("../../utils/parcelActor");
/**
 * Every parcel endpoint is shared by admin, branch (franchise) and hub logins.
 * The acting party is derived from the token and the service scopes the data
 * accordingly, so one controller serves all three route groups.
 *
 * The branch/hub route groups resolve the actor in `requireParcelRole`, so it
 * is reused here when present; the admin routes resolve it on demand.
 */
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access the parcel flow (or is inactive)',
        });
        return null;
    }
    return actor;
};
const fail = (res, result, fallback = 400) => res.status(result.code || fallback).json({
    success: false,
    message: result.message,
});
const createParcelOrder = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.createParcelOrder(req.body, actor);
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
exports.createParcelOrder = createParcelOrder;
const listFilters = (req) => {
    const hubAssignment = req.query.hubAssignment;
    const direction = req.query.direction;
    return {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        status: req.query.status,
        // `branch` / `deliveryBranch` are the deprecated query names
        agency: (req.query.agency || req.query.branch),
        deliveryAgency: (req.query.deliveryAgency || req.query.deliveryBranch),
        counterpartAgency: (req.query.counterpartAgency ||
            req.query.counterpartBranch),
        hub: req.query.hub,
        paymentType: req.query.paymentType,
        dateFrom: (req.query.dateFrom || req.query.date),
        dateTo: (req.query.dateTo || req.query.date),
        hubAssignment: hubAssignment === 'assigned' || hubAssignment === 'unassigned'
            ? hubAssignment
            : undefined,
        direction: direction === 'outgoing' || direction === 'incoming' ? direction : undefined,
    };
};
const getAllParcelOrders = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.getAllParcelOrders(listFilters(req), actor);
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
exports.getAllParcelOrders = getAllParcelOrders;
/**
 * Inward / outward register for one agency. A hub has no inward-outward of its
 * own — its movements are the hub queues.
 */
const register = (direction) => async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        if (actor.role === 'hub') {
            return res.status(403).json({
                success: false,
                message: 'The inward/outward register is for agency and admin logins',
            });
        }
        const result = await parcelOrder_service_1.parcelOrderService.getAgencyRegister(listFilters(req), actor, direction);
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
/** Parcels booked at this agency and sent out */
exports.getOutwardParcelOrders = register('outward');
/** Parcels booked elsewhere and addressed to this agency for delivery */
exports.getInwardParcelOrders = register('inward');
const getParcelOrderById = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.getParcelOrderById(String(req.params.id), actor);
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
exports.getParcelOrderById = getParcelOrderById;
const updateParcelOrder = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.updateParcelOrder(req.params.id, req.body, actor);
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
exports.updateParcelOrder = updateParcelOrder;
// Admin assigns the processing hub for a branch booking
const assignHub = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const { hub, note } = req.body;
        const result = await parcelOrder_service_1.parcelOrderService.assignHub(req.params.id, hub, actor, note);
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
exports.assignHub = assignHub;
// Hub (or admin) assigns the vehicle + driver that will carry the parcel
const assignVehicleAndDriver = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const { vehicle, driver, note } = req.body;
        const result = await parcelOrder_service_1.parcelOrderService.assignVehicleAndDriver(req.params.id, { vehicle, driver, note }, actor);
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
exports.assignVehicleAndDriver = assignVehicleAndDriver;
// Dropdown: available delivery branches (active franchises)
const getDeliveryAgencyOptions = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.getDeliveryAgencyOptions(req.query.search);
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
exports.getDeliveryAgencyOptions = getDeliveryAgencyOptions;
// Dropdown: assignable vehicles
const getVehicleOptions = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.getVehicleOptions(req.query.search);
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
exports.getVehicleOptions = getVehicleOptions;
// Dropdown: assignable drivers
const getDriverOptions = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.getDriverOptions(req.query.search);
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
exports.getDriverOptions = getDriverOptions;
const updateTransportationCharge = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const { transportationCharge, loadingCharge, miscellaneousCharge } = req.body;
        const result = await parcelOrder_service_1.parcelOrderService.updateTransportationCharge(req.params.id, transportationCharge, actor, { loadingCharge, miscellaneousCharge });
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
exports.updateTransportationCharge = updateTransportationCharge;
const updateParcelStatus = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const { status, note } = req.body;
        const result = await parcelOrder_service_1.parcelOrderService.updateStatus(req.params.id, status, actor, note);
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
exports.updateParcelStatus = updateParcelStatus;
const getParcelTracking = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.getTracking(req.params.id, actor);
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
exports.getParcelTracking = getParcelTracking;
const deleteParcelOrder = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelOrder_service_1.parcelOrderService.deleteParcelOrder(req.params.id, actor);
        if (!result.success)
            return fail(res, result, 404);
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.deleteParcelOrder = deleteParcelOrder;
