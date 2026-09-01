"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branchWallet_controller_1 = require("../../controllers/admin/branchWallet.controller");
const parcelSettlement_controller_1 = require("../../controllers/admin/parcelSettlement.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const agencyModule_1 = require("../../config/agencyModule");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const parcelSettlement_validator_1 = require("../../validators/admin/parcelSettlement.validator");
/**
 * Branch (franchise) view of its own wallet — base: /admin/branch/wallet
 *
 * Read-only: a branch tops up through the existing Cashfree recharge flow
 * (/api/wallet) or the admin adds the amount for it. Everything here is scoped
 * to the logged-in franchise, so no branch id is accepted.
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('agency'));
router.use((0, parcelActor_middleware_1.requireModulePermission)({ agency: (0, agencyModule_1.agencyPermission)(agencyModule_1.agencyModule.wallet_management) }, 'read'));
/**
 * @swagger
 * /admin/branch/wallet:
 *   get:
 *     summary: This branch's wallet balance, profit percentage and totals
 *     tags: [Wallet Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: >
 *           balance, profitPercentage, totalCredited, settledOrders,
 *           totalBookingAmount, totalProfitEarned, totalPaidToAdmin
 *       403: { description: Branch access required }
 */
router.get('/', branchWallet_controller_1.getMyBranchWallet);
/**
 * @swagger
 * /admin/branch/wallet/transactions:
 *   get:
 *     summary: This branch's wallet statement
 *     tags: [Wallet Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [credit, debit, refund, reversal] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Statement rows, newest first }
 */
router.get('/transactions', branchWallet_controller_1.getMyBranchWalletTransactions);
/**
 * @swagger
 * /admin/branch/wallet/preview:
 *   get:
 *     summary: Preview what a booking amount will cost this branch
 *     tags: [Wallet Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema: { type: number, example: 200 }
 *     responses:
 *       200:
 *         description: >
 *           orderAmount, profitPercentage, branchProfitAmount,
 *           adminShareAmount, walletDebitAmount (the full order amount taken
 *           from the wallet), walletBalance, balanceAfterBooking,
 *           sufficientBalance
 */
router.get('/preview', parcelSettlement_controller_1.previewSettlement);
/**
 * @swagger
 * /admin/branch/wallet/settlements:
 *   get:
 *     summary: This branch's parcel settlements
 *     description: Per booking - amount, profit kept, and amount sent to admin.
 *     tags: [Wallet Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
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
 *       200: { description: Settlements plus totals for this branch }
 * /admin/branch/wallet/settlements/summary:
 *   get:
 *     summary: This branch's earnings summary
 *     tags: [Wallet Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Totals booked, kept as profit and paid to admin }
 */
router.get('/settlements', parcelSettlement_controller_1.getAllSettlements);
router.get('/settlements/summary', parcelSettlement_controller_1.getSettlementSummary);
/**
 * @swagger
 * /admin/branch/wallet/settlements/{id}:
 *   get:
 *     summary: One of this branch's settlements with its transaction trail
 *     tags: [Wallet Flow - Branch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Settlement details }
 *       403: { description: Settlement belongs to another branch }
 */
router.get('/settlements/:id', (0, validate_middleware_1.validate)(parcelSettlement_validator_1.settlementByIdSchema), parcelSettlement_controller_1.getSettlementById);
exports.default = router;
