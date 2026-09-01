import { Router } from 'express';
import {
  createParcelOrder,
  getAllParcelOrders,
  getInwardParcelOrders,
  getOutwardParcelOrders,
  getParcelOrderById,
  updateParcelOrder,
  assignHub,
  assignVehicleAndDriver,
  updateTransportationCharge,
  updateParcelStatus,
  getDeliveryAgencyOptions,
  getVehicleOptions,
  getDriverOptions,
  getParcelTracking,
  deleteParcelOrder,
} from '../../controllers/admin/parcelOrder.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createParcelOrderSchema,
  updateParcelOrderSchema,
  assignHubSchema,
  assignVehicleDriverSchema,
  updateChargeSchema,
  updateParcelStatusSchema,
  parcelOrderByIdSchema,
} from '../../validators/admin/parcelOrder.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// All parcel order endpoints require authentication
router.use(authMiddleware);

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
router.post(
  '/',
  checkPermission(adminModule.parcel_management, 'write'),
  validate(createParcelOrderSchema),
  createParcelOrder
);

// List parcel orders
router.get(
  '/',
  checkPermission(adminModule.parcel_management, 'read'),
  getAllParcelOrders
);

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
router.get(
  '/outward',
  checkPermission(adminModule.parcel_management, 'read'),
  getOutwardParcelOrders
);
router.get(
  '/inward',
  checkPermission(adminModule.parcel_management, 'read'),
  getInwardParcelOrders
);

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
router.get(
  '/options/delivery-branches',
  checkPermission(adminModule.parcel_management, 'read'),
  getDeliveryAgencyOptions
);
router.get(
  '/options/vehicles',
  checkPermission(adminModule.parcel_management, 'read'),
  getVehicleOptions
);
router.get(
  '/options/drivers',
  checkPermission(adminModule.parcel_management, 'read'),
  getDriverOptions
);

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
router.get(
  '/:id',
  checkPermission(adminModule.parcel_management, 'read'),
  validate(parcelOrderByIdSchema),
  getParcelOrderById
);

// Update booking details
router.put(
  '/:id',
  checkPermission(adminModule.parcel_management, 'update'),
  validate(updateParcelOrderSchema),
  updateParcelOrder
);

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
router.patch(
  '/:id/assign-hub',
  checkPermission(adminModule.parcel_management, 'update'),
  validate(assignHubSchema),
  assignHub
);

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
router.patch(
  '/:id/assign-vehicle',
  checkPermission(adminModule.parcel_management, 'update'),
  validate(assignVehicleDriverSchema),
  assignVehicleAndDriver
);

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
router.get(
  '/:id/tracking',
  checkPermission(adminModule.parcel_management, 'read'),
  validate(parcelOrderByIdSchema),
  getParcelTracking
);

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
router.patch(
  '/:id/charge',
  checkPermission(adminModule.parcel_management, 'update'),
  validate(updateChargeSchema),
  updateTransportationCharge
);

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
router.patch(
  '/:id/status',
  checkPermission(adminModule.parcel_management, 'update'),
  validate(updateParcelStatusSchema),
  updateParcelStatus
);

// Delete parcel order
router.delete(
  '/:id',
  checkPermission(adminModule.parcel_management, 'delete'),
  validate(parcelOrderByIdSchema),
  deleteParcelOrder
);

export default router;
