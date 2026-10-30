"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminB2bOrder = exports.listAdminB2bOrders = exports.listB2bOrders = exports.getB2bOrder = exports.updateAdminB2bOrderStatus = exports.assignAdminB2bOrderVehicle = exports.assignAdminB2bOrderDriver = exports.assignB2bOrderDriver = exports.selectB2bOrderVehicle = exports.confirmB2bOrder = exports.getB2bDraftStep2Details = exports.getAdminB2bVehicles = exports.getB2bVehicles = exports.getB2bDrivers = exports.createB2bOrderDraft = void 0;
const order_service_1 = require("../../services/b2b/order.service");
const createB2bOrderDraft = async (req, res) => {
    const result = await order_service_1.b2bOrderService.createDraft(String(req.user.id), req.body);
    return res.status(result.success ? 201 : 400).json(result);
};
exports.createB2bOrderDraft = createB2bOrderDraft;
const getB2bDrivers = async (req, res) => res.json(await order_service_1.b2bOrderService.getDriverOptions(req.query));
exports.getB2bDrivers = getB2bDrivers;
const getB2bVehicles = async (req, res) => res.json(await order_service_1.b2bOrderService.getVehicleOptions(req.query));
exports.getB2bVehicles = getB2bVehicles;
const getAdminB2bVehicles = async (req, res) => res.json(await order_service_1.b2bOrderService.getAdminVehicleOptions(req.query));
exports.getAdminB2bVehicles = getAdminB2bVehicles;
const getB2bDraftStep2Details = async (req, res) => {
    try {
        return res.json(await order_service_1.b2bOrderService.getDraftStep2Details(String(req.params.id), String(req.user.id)));
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to calculate B2B order quote' });
    }
};
exports.getB2bDraftStep2Details = getB2bDraftStep2Details;
const confirmB2bOrder = async (req, res) => {
    try {
        return res.json(await order_service_1.b2bOrderService.confirm(String(req.params.id), String(req.user.id)));
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to confirm B2B order' });
    }
};
exports.confirmB2bOrder = confirmB2bOrder;
const selectB2bOrderVehicle = async (req, res) => {
    try {
        return res.json(await order_service_1.b2bOrderService.assignVehicle(String(req.params.id), String(req.body.vehicleId || req.body.vehicle), String(req.user.id)));
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to select B2B order vehicle' });
    }
};
exports.selectB2bOrderVehicle = selectB2bOrderVehicle;
const assignB2bOrderDriver = async (req, res) => res.json(await order_service_1.b2bOrderService.assignDriver(String(req.params.id), String(req.user.id), String(req.body.driver)));
exports.assignB2bOrderDriver = assignB2bOrderDriver;
const assignAdminB2bOrderDriver = async (req, res) => res.json(await order_service_1.b2bOrderService.assignDriver(String(req.params.id), undefined, String(req.body.driver)));
exports.assignAdminB2bOrderDriver = assignAdminB2bOrderDriver;
const assignAdminB2bOrderVehicle = async (req, res) => res.json(await order_service_1.b2bOrderService.assignAdminVehicle(String(req.params.id), String(req.body.vehicle)));
exports.assignAdminB2bOrderVehicle = assignAdminB2bOrderVehicle;
const updateAdminB2bOrderStatus = async (req, res) => res.json(await order_service_1.b2bOrderService.updateStatus(String(req.params.id), String(req.body.status)));
exports.updateAdminB2bOrderStatus = updateAdminB2bOrderStatus;
const getB2bOrder = async (req, res) => res.json(await order_service_1.b2bOrderService.getById(String(req.params.id), String(req.user?.id || '')));
exports.getB2bOrder = getB2bOrder;
const listB2bOrders = async (req, res) => res.json(await order_service_1.b2bOrderService.list(req.user?.id, req.query));
exports.listB2bOrders = listB2bOrders;
const listAdminB2bOrders = async (req, res) => res.json(await order_service_1.b2bOrderService.list(undefined, req.query));
exports.listAdminB2bOrders = listAdminB2bOrders;
const getAdminB2bOrder = async (req, res) => res.json(await order_service_1.b2bOrderService.getById(String(req.params.id)));
exports.getAdminB2bOrder = getAdminB2bOrder;
