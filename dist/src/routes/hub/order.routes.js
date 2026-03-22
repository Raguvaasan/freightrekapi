"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const shipment_validator_1 = require("../../validators/shipment.validator");
const order_controller_1 = require("../../controllers/hub/order.controller");
const router = (0, express_1.Router)();
// All routes require hub staff JWT
router.use(auth_middleware_1.authMiddleware);
router.post('/create', (0, validate_middleware_1.validate)(shipment_validator_1.createShipmentSchema), order_controller_1.createHubOrder);
router.get('/', order_controller_1.getHubOrders);
router.get('/track/:waybill', order_controller_1.trackHubOrder);
router.get('/:orderId', order_controller_1.getHubOrder);
router.put('/:orderId', (0, validate_middleware_1.validate)(shipment_validator_1.updateShipmentSchema), order_controller_1.updateHubOrder);
router.delete('/:orderId', order_controller_1.deleteHubOrder);
exports.default = router;
