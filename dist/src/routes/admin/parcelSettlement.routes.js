"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parcelSettlement_controller_1 = require("../../controllers/admin/parcelSettlement.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const parcelSettlement_validator_1 = require("../../validators/admin/parcelSettlement.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
/**
 * Parcel wallet settlements — base: /admin/parcel-settlement
 *
 * A settlement is written automatically for every booking: the admin's share
 * of the booking amount is debited from the branch wallet and credited to the
 * admin settlement wallet. These endpoints read that ledger and, where a
 * booking is cancelled, reverse it.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('admin'));
/**
 * @swagger
 * /admin/parcel-settlement:
 *   get:
 *     summary: List parcel wallet settlements
 *     tags: [Wallet Settlement]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *         description: Branch (Agency) ObjectId
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [settled, reversed] }
 *       - in: query
 *         name: orderNumber
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: >
 *           Settlements plus totals — totalOrderAmount, totalBranchProfit,
 *           totalAdminShare
 */
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), parcelSettlement_controller_1.getAllSettlements);
/**
 * @swagger
 * /admin/parcel-settlement/summary:
 *   get:
 *     summary: Admin earnings summary, overall and per branch
 *     tags: [Wallet Settlement]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: >
 *           settledOrders, totalOrderAmount, totalBranchProfit,
 *           totalAdminShare, reversedOrders, reversedAmount, perBranch[]
 */
router.get('/summary', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), parcelSettlement_controller_1.getSettlementSummary);
/**
 * @swagger
 * /admin/parcel-settlement/preview:
 *   get:
 *     summary: Preview the split for a booking amount before booking it
 *     description: >
 *       Shows what a booking of this amount would take from the branch wallet,
 *       what the branch keeps, and whether the balance covers it.
 *     tags: [Wallet Settlement]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema: { type: number, example: 200 }
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *         description: Branch ObjectId (admin only; a branch login uses its own)
 *     responses:
 *       200:
 *         description: >
 *           orderAmount, profitPercentage, branchProfitAmount,
 *           adminShareAmount, walletDebitAmount (the full order amount taken
 *           from the wallet), walletBalance, balanceAfterBooking,
 *           sufficientBalance
 *       400: { description: A valid amount is required }
 */
router.get('/preview', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), parcelSettlement_controller_1.previewSettlement);
/**
 * @swagger
 * /admin/parcel-settlement/order/{orderId}/settle:
 *   post:
 *     summary: Settle a parcel order manually
 *     description: >
 *       For bookings that have no active settlement — orders created before the
 *       wallet flow existed, or a settlement that was reversed and now needs to
 *       be re-applied. New bookings settle themselves.
 *     tags: [Wallet Settlement]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         description: Parcel order ObjectId
 *     responses:
 *       201: { description: Settled; branch wallet debited, admin wallet credited }
 *       402: { description: Insufficient branch wallet balance }
 *       404: { description: Parcel order not found }
 *       409: { description: Order is already settled }
 */
router.post('/order/:orderId/settle', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'write'), (0, validate_middleware_1.validate)(parcelSettlement_validator_1.settleOrderSchema), parcelSettlement_controller_1.settleParcelOrder);
/**
 * @swagger
 * /admin/parcel-settlement/{id}:
 *   get:
 *     summary: One settlement with its wallet transaction trail
 *     tags: [Wallet Settlement]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Settlement plus the transactions that carried it }
 *       404: { description: Settlement not found }
 *   patch:
 *     summary: Edit settlement notes
 *     tags: [Wallet Settlement]
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
 *             required: [notes]
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       200: { description: Notes updated }
 */
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), (0, validate_middleware_1.validate)(parcelSettlement_validator_1.settlementByIdSchema), parcelSettlement_controller_1.getSettlementById);
router.patch('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'update'), (0, validate_middleware_1.validate)(parcelSettlement_validator_1.updateSettlementNotesSchema), parcelSettlement_controller_1.updateSettlementNotes);
/**
 * @swagger
 * /admin/parcel-settlement/{id}/reverse:
 *   post:
 *     summary: Reverse a settlement (refund the booked amount to the branch)
 *     description: >
 *       Use when a booking is cancelled. The amount debited at booking leaves
 *       the admin settlement wallet and goes back to the branch wallet. Deleting
 *       a parcel order reverses its settlement automatically.
 *     tags: [Wallet Settlement]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Booking cancelled by customer" }
 *     responses:
 *       200: { description: Reversed; amount refunded to the branch wallet }
 *       409: { description: Already reversed }
 */
router.post('/:id/reverse', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'update'), (0, validate_middleware_1.validate)(parcelSettlement_validator_1.reverseSettlementSchema), parcelSettlement_controller_1.reverseSettlement);
exports.default = router;
