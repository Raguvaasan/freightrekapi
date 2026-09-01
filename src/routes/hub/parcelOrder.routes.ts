import { Router } from 'express';
import {
  getAllParcelOrders,
  getParcelOrderById,
  updateParcelStatus,
  assignVehicleAndDriver,
  getVehicleOptions,
  getDriverOptions,
  getParcelTracking,
} from '../../controllers/admin/parcelOrder.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { hubModule, hubPermission } from '../../config/hubModule';
import { validate } from '../../middleware/validate.middleware';
import {
  hubStatusSchema,
  assignVehicleDriverSchema,
  parcelOrderByIdSchema,
} from '../../validators/admin/parcelOrder.validator';

/**
 * Hub side of the parcel flow - base: /hub/parcel-order
 *
 * A hub sees only the orders an admin has assigned to it, and can move them
 * through the hub processing stages. It cannot book or edit bookings.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('hub'));

/**
 * A direct hub login owns its parcel module; hub staff are measured against the
 * "Parcel Management" permissions on their HubRole.
 */
const parcels = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission({ hub: hubPermission(hubModule.parcel_management) }, action);

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
router.get('/', parcels('read'), getAllParcelOrders);

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
router.get('/options/vehicles', parcels('read'), getVehicleOptions);

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
router.get('/options/drivers', parcels('read'), getDriverOptions);

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
router.get('/:id', parcels('read'), validate(parcelOrderByIdSchema), getParcelOrderById);

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
router.get('/:id/tracking', parcels('read'), validate(parcelOrderByIdSchema), getParcelTracking);

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
router.patch('/:id/status', parcels('update'), validate(hubStatusSchema), updateParcelStatus);

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
router.patch(
  '/:id/assign-vehicle',
  parcels('update'),
  validate(assignVehicleDriverSchema),
  assignVehicleAndDriver
);

export default router;
