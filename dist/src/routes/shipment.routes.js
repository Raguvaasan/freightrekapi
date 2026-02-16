"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const shipment_controller_1 = require("../controllers/shipment.controller");
const shipment_validator_1 = require("../validators/shipment.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.post('/create', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(shipment_validator_1.createShipmentSchema), shipment_controller_1.createShipment);
router.get('/orders', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(shipment_validator_1.getShipmentsSchema), shipment_controller_1.getShipments);
router.get('/order/:orderId', auth_middleware_1.authMiddleware, shipment_controller_1.getShipment);
router.put('/order/:orderId', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(shipment_validator_1.updateShipmentSchema), shipment_controller_1.updateShipment);
router.delete('/order/:orderId', auth_middleware_1.authMiddleware, shipment_controller_1.deleteShipment);
router.get('/track/:waybill', auth_middleware_1.authMiddleware, shipment_controller_1.trackShipment);
exports.default = router;
