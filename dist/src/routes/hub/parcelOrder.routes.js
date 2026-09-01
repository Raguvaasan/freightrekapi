"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parcelOrder_controller_1 = require("../../controllers/admin/parcelOrder.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const hubModule_1 = require("../../config/hubModule");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const parcelOrder_validator_1 = require("../../validators/admin/parcelOrder.validator");
/**
 * Hub side of the parcel flow - base: /hub/parcel-order
 *
 * A hub sees only the orders an admin has assigned to it, and can move them
 * through the hub processing stages. It cannot book or edit bookings.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('hub'));
/**
 * A direct hub login owns its parcel module; hub staff are measured against the
 * "Parcel Management" permissions on their HubRole.
 */
const parcels = (action) => (0, parcelActor_middleware_1.requireModulePermission)({ hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.parcel_management) }, action);
/**
 * @swagger
 * /hub/parcel-order:
 *   get:
 *     summary: List parcel orders assigned to this hub
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: e.g. "Hub Assigned" for the incoming queue
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *     responses:
 *       200: { description: Orders assigned to this hub only }
 *       403: { description: Hub access required }
 */
router.get('/', parcels('read'), parcelOrder_controller_1.getAllParcelOrders);
/**
 * @swagger
 * /hub/parcel-order/options/vehicles:
 *   get:
 *     summary: Dropdown - active vehicles the hub can assign
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches registration number or vehicle type
 *     responses:
 *       200: { description: "[{ _id, vehicleType, vehicleRegistrationNumber, capacity }]" }
 */
router.get('/options/vehicles', parcels('read'), parcelOrder_controller_1.getVehicleOptions);
/**
 * @swagger
 * /hub/parcel-order/options/drivers:
 *   get:
 *     summary: Dropdown - active drivers the hub can assign
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches driver name, phone or licence number
 *     responses:
 *       200: { description: "[{ _id, driverName, phoneNumber, licenseNumber, dateOfExpiry }]" }
 */
router.get('/options/drivers', parcels('read'), parcelOrder_controller_1.getDriverOptions);
/**
 * @swagger
 * /hub/parcel-order/{id}:
 *   get:
 *     summary: Get one parcel order assigned to this hub
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order details }
 *       403: { description: Order is not assigned to this hub }
 */
router.get('/:id', parcels('read'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.parcelOrderByIdSchema), parcelOrder_controller_1.getParcelOrderById);
/**
 * @swagger
 * /hub/parcel-order/{id}/tracking:
 *   get:
 *     summary: Status timeline of an order assigned to this hub
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Current status + timeline }
 */
router.get('/:id/tracking', parcels('read'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.parcelOrderByIdSchema), parcelOrder_controller_1.getParcelTracking);
/**
 * @swagger
 * /hub/parcel-order/{id}/status:
 *   patch:
 *     summary: Hub-side status update
 *     description: >
 *       A hub may set only its own stages - Parcel Arrived at Hub,
 *       Parcel Processed at Hub, Parcel Dispatched from Hub.
 *       The lifecycle moves forward only.
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Parcel Arrived at Hub, Parcel Processed at Hub, Parcel Dispatched from Hub]
 *               note: { type: string }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Backwards move }
 *       403: { description: Status not allowed for a hub, or order not assigned here }
 */
router.patch('/:id/status', parcels('update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.hubStatusSchema), parcelOrder_controller_1.updateParcelStatus);
/**
 * @swagger
 * /hub/parcel-order/{id}/assign-vehicle:
 *   patch:
 *     summary: Assign the vehicle and driver for onward movement
 *     description: >
 *       Send either field on its own to change just that one. Send an empty
 *       string or null to clear an existing assignment. Vehicle and driver must
 *       be Active. The change is recorded in statusHistory without moving the
 *       lifecycle status.
 *     tags: [Parcel Flow - Hub]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle: { type: string, nullable: true, description: Vehicle ObjectId }
 *               driver: { type: string, nullable: true, description: Driver ObjectId }
 *               note: { type: string }
 *     responses:
 *       200: { description: Vehicle / driver assigned }
 *       400: { description: Vehicle or driver invalid or inactive }
 *       403: { description: Order is not assigned to this hub }
 */
router.patch('/:id/assign-vehicle', parcels('update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.assignVehicleDriverSchema), parcelOrder_controller_1.assignVehicleAndDriver);
exports.default = router;
