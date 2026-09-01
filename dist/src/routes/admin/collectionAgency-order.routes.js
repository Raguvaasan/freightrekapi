"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const shipment_validator_1 = require("../../validators/shipment.validator");
const collectionAgency_order_controller_1 = require("../../controllers/admin/collectionAgency-order.controller");
const router = (0, express_1.Router)();
// All routes require collection agency (or collection agency staff) JWT
router.use(auth_middleware_1.authMiddleware);
router.post('/create', (0, validate_middleware_1.validate)(shipment_validator_1.createShipmentSchema), collectionAgency_order_controller_1.createCollectionAgencyOrder);
router.get('/', collectionAgency_order_controller_1.getCollectionAgencyOrders);
router.get('/track/:waybill', collectionAgency_order_controller_1.trackCollectionAgencyOrder);
router.get('/:orderId', collectionAgency_order_controller_1.getCollectionAgencyOrder);
router.put('/:orderId', (0, validate_middleware_1.validate)(shipment_validator_1.updateShipmentSchema), collectionAgency_order_controller_1.updateCollectionAgencyOrder);
router.delete('/:orderId', collectionAgency_order_controller_1.deleteCollectionAgencyOrder);
exports.default = router;
