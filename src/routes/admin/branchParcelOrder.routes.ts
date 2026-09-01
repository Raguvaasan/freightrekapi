import { Router } from 'express';
import {
  createParcelOrder,
  getAllParcelOrders,
  getInwardParcelOrders,
  getOutwardParcelOrders,
  getParcelOrderById,
  updateParcelOrder,
  updateTransportationCharge,
  updateParcelStatus,
  getDeliveryAgencyOptions,
  getParcelTracking,
} from '../../controllers/admin/parcelOrder.controller';
import { previewSettlement } from '../../controllers/admin/parcelSettlement.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { agencyModule, agencyPermission } from '../../config/agencyModule';
import { validate } from '../../middleware/validate.middleware';
import {
  branchCreateParcelOrderSchema,
  updateParcelOrderSchema,
  updateChargeSchema,
  branchStatusSchema,
  parcelOrderByIdSchema,
} from '../../validators/admin/parcelOrder.validator';

/**
 * Branch (franchise) side of the parcel flow — base: /admin/branch/parcel-order
 *
 * The branch is taken from the logged-in franchise token (franchise direct
 * login or franchise staff), so every request is automatically scoped to the
 * caller's own bookings. No `branch` field is accepted in the body.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('agency'));

/**
 * A direct agency login owns its parcel module; agency staff are measured
 * against the "Parcel Management" permissions on their FranchiseRole.
 */
const parcels = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission({ agency: agencyPermission(agencyModule.parcel_management) }, action);

/**
 * @swagger
 * /admin/branch/parcel-order:
 *   post:
 *     summary: Book a parcel order (branch / franchise login)
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingCustomer, paymentType, deliveryCustomer, parcelDetails]
 *             properties:
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
 *                       GET /admin/agency/parcel-order/options/delivery-branches. Can be set later via PUT /admin/agency/parcel-order/{{id}}.
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
 *               transportationCharge: { type: number }
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
 *       201: { description: Order booked with status "Order Created" }
 *       403: { description: Branch access required }
 *   get:
 *     summary: List this branch's parcel orders
 *     tags: [Parcel Flow - Branch]
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
 *       - in: query
 *         name: hubAssignment
 *         schema: { type: string, enum: [assigned, unassigned] }
 *       - in: query
 *         name: direction
 *         schema: { type: string, enum: [outgoing, incoming] }
 *         description: >
 *           outgoing = booked at this branch, incoming = addressed to this
 *           branch for delivery. Omit for both.
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *     responses:
 *       200: { description: Orders booked at or addressed to this branch }
 */
router.post('/', parcels('write'), validate(branchCreateParcelOrderSchema), createParcelOrder);
router.get('/', parcels('read'), getAllParcelOrders);

/**
 * @swagger
 * /admin/branch/parcel-order/outward:
 *   get:
 *     summary: This branch's outward register
 *     description: >
 *       Parcels booked at this branch and sent out. The branch comes from the
 *       token. Same filters as the list; counterpartAgency narrows it to one
 *       destination branch.
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: counterpartAgency
 *         schema: { type: string }
 *         description: Destination branch ObjectId
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
 *         description: "{ direction: outward, agency, orders, totals, pagination }"
 * /admin/branch/parcel-order/inward:
 *   get:
 *     summary: This branch's inward register
 *     description: >
 *       Parcels booked at another branch and addressed to this one for
 *       delivery. counterpartAgency here narrows it to one origin branch.
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: counterpartAgency
 *         schema: { type: string }
 *         description: Origin (booking) branch ObjectId
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
 */
// Before /:id, so the words are not read as an order id
router.get('/outward', parcels('read'), getOutwardParcelOrders);
router.get('/inward', parcels('read'), getInwardParcelOrders);

/**
 * @swagger
 * /admin/branch/parcel-order/options/delivery-branches:
 *   get:
 *     summary: Dropdown - available delivery branches
 *     description: Active franchises that can be chosen as the destination branch.
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches branch name, city or pincode
 *     responses:
 *       200: { description: "[{ _id, agencyName, agencyOwner, phone, city, state, pincode }]" }
 */
router.get('/options/delivery-branches', parcels('read'), getDeliveryAgencyOptions);

/**
 * @swagger
 * /admin/branch/parcel-order/wallet-preview:
 *   get:
 *     summary: What a booking of this amount will take from the branch wallet
 *     description: >
 *       Booking a parcel debits the admin's share of the transportation charge
 *       from this branch's wallet. Call this before booking to show the split
 *       and warn on a low balance.
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema: { type: number, example: 200 }
 *         description: The transportation charge being quoted
 *     responses:
 *       200:
 *         description: >
 *           orderAmount, profitPercentage, branchProfitAmount,
 *           adminShareAmount, walletDebitAmount (the full order amount taken
 *           from the wallet), walletBalance, balanceAfterBooking,
 *           sufficientBalance
 *       400: { description: A valid amount is required }
 */
router.get('/wallet-preview', parcels('read'), previewSettlement);

/**
 * @swagger
 * /admin/branch/parcel-order/{id}:
 *   get:
 *     summary: Get one of this branch's parcel orders
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order details (branch/hub populated) }
 *       403: { description: Order belongs to another branch }
 *   put:
 *     summary: Update booking details of this branch's order
 *     tags: [Parcel Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Order belongs to another branch }
 */
router.get('/:id', parcels('read'), validate(parcelOrderByIdSchema), getParcelOrderById);
router.put('/:id', parcels('update'), validate(updateParcelOrderSchema), updateParcelOrder);

/**
 * @swagger
 * /admin/branch/parcel-order/{id}/tracking:
 *   get:
 *     summary: Status timeline of this branch's order
 *     tags: [Parcel Flow - Branch]
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
 * /admin/branch/parcel-order/{id}/charge:
 *   patch:
 *     summary: Update transportation charge on this branch's order
 *     tags: [Parcel Flow - Branch]
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
router.patch('/:id/charge', parcels('update'), validate(updateChargeSchema), updateTransportationCharge);

/**
 * @swagger
 * /admin/branch/parcel-order/{id}/status:
 *   patch:
 *     summary: Branch-side status update
 *     description: >
 *       A branch may set only its own stages —
 *       Parcel Collected, Parcel Dispatched, Parcel Arrived at Branch,
 *       Parcel Received at Branch, Delivered. The lifecycle moves forward only.
 *     tags: [Parcel Flow - Branch]
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
 *                 enum: [Parcel Collected, Parcel Dispatched, Parcel Arrived at Branch, Parcel Received at Branch, Delivered]
 *               note: { type: string }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Backwards move, or hub stage without a hub }
 *       403: { description: Status not allowed for a branch }
 */
router.patch('/:id/status', parcels('update'), validate(branchStatusSchema), updateParcelStatus);

export default router;
