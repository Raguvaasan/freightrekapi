"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminB2bOrders = exports.listB2bOrders = exports.getB2bOrder = exports.confirmB2bOrder = exports.getB2bDraftStep2Details = exports.createB2bOrderDraft = void 0;
const order_service_1 = require("../../services/b2b/order.service");
const createB2bOrderDraft = async (req, res) => {
    const result = await order_service_1.b2bOrderService.createDraft(req.user.id, req.body);
    return res.status(result.success ? 201 : 400).json(result);
};
exports.createB2bOrderDraft = createB2bOrderDraft;
const getB2bDraftStep2Details = async (req, res) => res.json(await order_service_1.b2bOrderService.getDraftStep2Details(req.params.id, req.user.id));
exports.getB2bDraftStep2Details = getB2bDraftStep2Details;
const confirmB2bOrder = async (req, res) => res.json(await order_service_1.b2bOrderService.confirm(req.params.id, req.user.id));
exports.confirmB2bOrder = confirmB2bOrder;
const getB2bOrder = async (req, res) => res.json(await order_service_1.b2bOrderService.getById(req.params.id, req.user?.id));
exports.getB2bOrder = getB2bOrder;
const listB2bOrders = async (req, res) => res.json(await order_service_1.b2bOrderService.list(req.user?.id, req.query));
exports.listB2bOrders = listB2bOrders;
const listAdminB2bOrders = async (req, res) => res.json(await order_service_1.b2bOrderService.list(undefined, req.query));
exports.listAdminB2bOrders = listAdminB2bOrders;
