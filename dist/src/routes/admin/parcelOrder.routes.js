"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parcelOrder_controller_1 = require("../../controllers/admin/parcelOrder.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const parcelOrder_validator_1 = require("../../validators/admin/parcelOrder.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
// All parcel order endpoints require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /admin/parcel-order:
 *   post:
 *     summary: Create a parcel order (booking)
 *     tags: [Parcel Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branch, bookingCustomer, paymentType, deliveryCustomer, parcelDetails]
 *             properties:
 *               branch:
 *                 type: string
 *                 description: Branch (franchise / agency) ObjectId
 *               bookingCustomer:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   mobileNumber: { type: string }
 *               paymentType:
 *                 type: string
 *                 enum: [Paid, To Pay, Credit]
 *               deliveryCustomer:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   mobileNumber: { type: string }
 *                   deliveryAgency:
 *                     type: string
 *                     description: >
 *                       Optional. Destination agency ObjectId, picked from
 *                       GET /admin/parcel-order/options/delivery-branches. Can be set later via PUT /admin/parcel-order/{{id}}.
 *                   deliveryBranch:
 *                     type: string
 *                     description: Deprecated alias for deliveryAgency
 *               pickupAddress:
 *                 type: string
 *                 description: Where the parcel is collected from the booking customer
 *               deliveryAddress:
 *                 type: string
 *                 description: Where the parcel is delivered to the delivery customer
 *               parcelDetails:
 *                 type: object
 *                 properties:
 *                   article: { type: string }
 *                   remarks: { type: string }
 *                   numberOfParcels: { type: integer }
 *                   approximateValue: { type: number }
 *               transportationCharge:
 *                 type: number
 *                 description: Optional. Defaults to 0; editable later via /charge.
 *               waybill:
 *                 type: string
 *                 description: Optional. Carrier waybill / AWB number
 *               vehicleType:
 *                 type: string
 *                 description: Optional. Vehicle class booked for the movement
 *               vehicleCapacity:
 *                 type: string
 *                 description: Optional. Capacity of that vehicle (e.g. "2 Ton")
 *     responses:
 *       201:
 *         description: Parcel order created
 *       400:
 *         description: Validation error / branch (franchise) invalid or inactive
 *   get:
 *     summary: List parcel orders (pagination, search, filters)
 *     tags: [Parcel Management]
 *     security:
 *       - bearerAuth: []
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
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *         description: Booking branch ObjectId
 *       - in: query
 *         name: deliveryBranch
 *         schema: { type: string }
 *         description: Destination branch ObjectId
 *       - in: query
 *         name: hub
 *         schema: { type: string }
 *       - in: query
 *         name: hubAssignment
 *         schema: { type: string, enum: [assigned, unassigned] }
 *         description: Use "unassigned" for the admin hub-assignment queue
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: >
 *           List of parcel orders. Each row carries its invoice as
 *           invoiceId, invoiceNumber and invoice
 *           { _id, invoiceNumber, invoiceDate, status, totalAmount },
 *           null when no invoice has been raised for the order.
 */
// 2.3 Create parcel order
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'write'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.createParcelOrderSchema), parcelOrder_controller_1.createParcelOrder);
// List parcel orders
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), parcelOrder_controller_1.getAllParcelOrders);
/**
 * @swagger
 * /admin/parcel-order/outward:
 *   get:
 *     summary: Outward register - parcels booked at an agency and sent out
 *     description: >
 *       Admin must name the agency with `agency`; an agency login always gets
 *       its own register. Same filters as the list, plus counterpartAgency.
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: agency
 *         schema: { type: string }
 *         description: Agency whose register this is. Required for admin, ignored for an agency login
 *       - in: query
 *         name: counterpartAgency
 *         schema: { type: string }
 *         description: Destination agency, to see only what went to one agency
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
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *       - in: query
 *         name: hubAssignment
 *         schema: { type: string, enum: [assigned, unassigned] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: "{ direction: outward, agency, orders, totals, pagination }"
 *       400: { description: agency is required for an admin login }
 *       403: { description: Not available to a hub login }
 * /admin/parcel-order/inward:
 *   get:
 *     summary: Inward register - parcels addressed to an agency for delivery
 *     description: >
 *       Same shape as the outward register; counterpartAgency here filters the
 *       origin (booking) agency.
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: agency
 *         schema: { type: string }
 *         description: Agency whose register this is. Required for admin, ignored for an agency login
 *       - in: query
 *         name: counterpartAgency
 *         schema: { type: string }
 *         description: Origin agency, to see only what came from one agency
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
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: "{ direction: inward, agency, orders, totals, pagination }"
 *       400: { description: agency is required for an admin login }
 *       403: { description: Not available to a hub login }
 */
// Registered before /:id so the words are not read as an order id
router.get('/outward', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), parcelOrder_controller_1.getOutwardParcelOrders);
router.get('/inward', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), parcelOrder_controller_1.getInwardParcelOrders);
/**
 * @swagger
 * /admin/parcel-order/options/delivery-branches:
 *   get:
 *     summary: Dropdown - available delivery branches (active franchises)
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: "[{ _id, agencyName, agencyOwner, phone, city, state, pincode }]" }
 * /admin/parcel-order/options/vehicles:
 *   get:
 *     summary: Dropdown - active vehicles
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: "[{ _id, vehicleType, vehicleRegistrationNumber, capacity }]" }
 * /admin/parcel-order/options/drivers:
 *   get:
 *     summary: Dropdown - active drivers
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: "[{ _id, driverName, phoneNumber, licenseNumber, dateOfExpiry }]" }
 */
router.get('/options/delivery-branches', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), parcelOrder_controller_1.getDeliveryAgencyOptions);
router.get('/options/vehicles', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), parcelOrder_controller_1.getVehicleOptions);
router.get('/options/drivers', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), parcelOrder_controller_1.getDriverOptions);
/**
 * @swagger
 * /admin/parcel-order/{id}:
 *   get:
 *     summary: Get a parcel order by ID
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Parcel order details }
 *       404: { description: Not found }
 *   put:
 *     summary: Update parcel order booking details
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a parcel order
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
// Get parcel order by ID
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.parcelOrderByIdSchema), parcelOrder_controller_1.getParcelOrderById);
// Update booking details
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.updateParcelOrderSchema), parcelOrder_controller_1.updateParcelOrder);
/**
 * @swagger
 * /admin/parcel-order/{id}/assign-hub:
 *   patch:
 *     summary: Assign the processing hub to a branch booking (admin only)
 *     tags: [Parcel Management]
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
 *             required: [hub]
 *             properties:
 *               hub: { type: string, description: Hub ObjectId }
 *               note: { type: string }
 *     responses:
 *       200: { description: Hub assigned; status moves to "Hub Assigned" }
 *       400: { description: Hub invalid/inactive, or parcel already at hub }
 *       403: { description: Only admin can assign a hub }
 */
// Admin assigns the hub that will process the parcel
router.patch('/:id/assign-hub', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.assignHubSchema), parcelOrder_controller_1.assignHub);
/**
 * @swagger
 * /admin/parcel-order/{id}/assign-vehicle:
 *   patch:
 *     summary: Assign the vehicle and driver (admin override of the hub action)
 *     tags: [Parcel Management]
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
 */
router.patch('/:id/assign-vehicle', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.assignVehicleDriverSchema), parcelOrder_controller_1.assignVehicleAndDriver);
/**
 * @swagger
 * /admin/parcel-order/{id}/tracking:
 *   get:
 *     summary: Full status timeline for a parcel order
 *     tags: [Parcel Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Current status + statusHistory timeline }
 */
router.get('/:id/tracking', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'read'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.parcelOrderByIdSchema), parcelOrder_controller_1.getParcelTracking);
/**
 * @swagger
 * /admin/parcel-order/{id}/charge:
 *   patch:
 *     summary: Update transportation charge (2.4)
 *     tags: [Parcel Management]
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
 *             required: [transportationCharge]
 *             properties:
 *               transportationCharge: { type: number }
 *     responses:
 *       200: { description: Charge updated }
 */
// 2.4 Update transportation charge
router.patch('/:id/charge', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.updateChargeSchema), parcelOrder_controller_1.updateTransportationCharge);
/**
 * @swagger
 * /admin/parcel-order/{id}/status:
 *   patch:
 *     summary: Update parcel tracking status (2.5)
 *     tags: [Parcel Management]
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
 *                 enum: [Order Created, Parcel Collected, Parcel Dispatched, Parcel Arrived at Branch, Parcel Received at Branch, Delivered]
 *               note: { type: string }
 *     responses:
 *       200: { description: Status updated }
 */
// 2.5 Update parcel tracking status
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'update'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.updateParcelStatusSchema), parcelOrder_controller_1.updateParcelStatus);
// Delete parcel order
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.parcel_management, 'delete'), (0, validate_middleware_1.validate)(parcelOrder_validator_1.parcelOrderByIdSchema), parcelOrder_controller_1.deleteParcelOrder);
exports.default = router;
