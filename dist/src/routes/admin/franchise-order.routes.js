"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const agencyModule_1 = require("../../config/agencyModule");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const shipment_validator_1 = require("../../validators/shipment.validator");
const franchise_order_controller_1 = require("../../controllers/admin/franchise-order.controller");
const router = (0, express_1.Router)();
// All routes require franchise (or franchise staff) JWT
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('agency'));
/**
 * A direct agency login owns its orders; agency staff are measured against the
 * "Parcel Management" permissions on their FranchiseRole.
 */
const orders = (action) => (0, parcelActor_middleware_1.requireModulePermission)({ agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.parcel_management) }, action);
router.post('/create', orders('write'), (0, validate_middleware_1.validate)(shipment_validator_1.createShipmentSchema), franchise_order_controller_1.createFranchiseOrder);
router.get('/', orders('read'), franchise_order_controller_1.getFranchiseOrders);
router.get('/track/:waybill', orders('read'), franchise_order_controller_1.trackFranchiseOrder);
router.get('/:orderId', orders('read'), franchise_order_controller_1.getFranchiseOrder);
router.put('/:orderId', orders('update'), (0, validate_middleware_1.validate)(shipment_validator_1.updateShipmentSchema), franchise_order_controller_1.updateFranchiseOrder);
router.delete('/:orderId', orders('delete'), franchise_order_controller_1.deleteFranchiseOrder);
exports.default = router;
