"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const ltlShipment_controller_1 = require("../controllers/ltlShipment.controller");
const ltlShipment_validator_1 = require("../validators/ltlShipment.validator");
const router = (0, express_1.Router)();
// Create LTL shipment
router.post('/create', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(ltlShipment_validator_1.createLtlShipmentSchema), ltlShipment_controller_1.createLtlShipment);
// Get all LTL shipments (paginated)
router.get('/orders', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(ltlShipment_validator_1.getLtlShipmentsSchema), ltlShipment_controller_1.getLtlShipments);
// Get single LTL shipment
router.get('/order/:orderId', auth_middleware_1.authMiddleware, ltlShipment_controller_1.getLtlShipment);
// Update LTL shipment
router.put('/order/:orderId', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(ltlShipment_validator_1.updateLtlShipmentSchema), ltlShipment_controller_1.updateLtlShipment);
// Delete (cancel) LTL shipment
router.delete('/order/:orderId', auth_middleware_1.authMiddleware, ltlShipment_controller_1.deleteLtlShipment);
exports.default = router;
