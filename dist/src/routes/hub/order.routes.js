"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const hubModule_1 = require("../../config/hubModule");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const shipment_validator_1 = require("../../validators/shipment.validator");
const order_controller_1 = require("../../controllers/hub/order.controller");
const router = (0, express_1.Router)();
// All routes require hub staff JWT
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('hub'));
/**
 * A direct hub login owns its orders; hub staff are measured against the
 * "Parcel Management" permissions on their HubRole.
 */
const orders = (action) => (0, parcelActor_middleware_1.requireModulePermission)({ hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.parcel_management) }, action);
router.post('/create', orders('write'), (0, validate_middleware_1.validate)(shipment_validator_1.createShipmentSchema), order_controller_1.createHubOrder);
router.get('/', orders('read'), order_controller_1.getHubOrders);
router.get('/track/:waybill', orders('read'), order_controller_1.trackHubOrder);
router.get('/:orderId', orders('read'), order_controller_1.getHubOrder);
router.put('/:orderId', orders('update'), (0, validate_middleware_1.validate)(shipment_validator_1.updateShipmentSchema), order_controller_1.updateHubOrder);
router.delete('/:orderId', orders('delete'), order_controller_1.deleteHubOrder);
exports.default = router;
