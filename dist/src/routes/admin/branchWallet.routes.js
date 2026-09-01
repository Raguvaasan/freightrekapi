"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branchWallet_controller_1 = require("../../controllers/admin/branchWallet.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const branchWallet_validator_1 = require("../../validators/admin/branchWallet.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
/**
 * Admin management of branch (franchise) wallets — base: /admin/branch-wallet
 *
 * The admin tops a branch up here. Parcel bookings then draw the admin's share
 * of each booking amount out of that balance automatically
 * (see /admin/parcel-settlement).
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('admin'));
/**
 * @swagger
 * /admin/branch-wallet:
 *   get:
 *     summary: List branch wallets with balances and settlement totals
 *     tags: [Wallet Management]
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
 *         description: Matches branch name, owner, phone or city
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200:
 *         description: >
 *           Per branch: balance, profitPercentage, settledOrders,
 *           totalBookingAmount, totalProfitEarned, totalPaidToAdmin
 */
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), branchWallet_controller_1.getAllBranchWallets);
/**
 * @swagger
 * /admin/branch-wallet/admin-wallet:
 *   get:
 *     summary: The admin settlement wallet (everything branches have remitted)
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: >
 *           balance, settledOrders, totalBookingAmount,
 *           totalBranchProfitGiven, totalReceivedFromBranches,
 *           allBranchesBalance
 * /admin/branch-wallet/admin-wallet/transactions:
 *   get:
 *     summary: Admin settlement wallet statement
 *     tags: [Wallet Management]
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
router.get('/admin-wallet', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), branchWallet_controller_1.getAdminWallet);
router.get('/admin-wallet/transactions', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), branchWallet_controller_1.getAdminWalletTransactions);
/**
 * @swagger
 * /admin/branch-wallet/transactions/{transactionId}:
 *   get:
 *     summary: Get one wallet statement row
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Transaction details }
 *       404: { description: Transaction not found }
 *   patch:
 *     summary: Edit the remarks on a manual admin entry
 *     description: >
 *       Only manual admin top-ups / deductions can be edited, and only their
 *       remarks — amounts are corrected by reversing and re-adding, so the
 *       statement stays auditable. Parcel settlement and payment gateway rows
 *       are read-only.
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [remarks]
 *             properties:
 *               remarks: { type: string, example: "Cash received on 05-Aug — corrected note" }
 *     responses:
 *       200: { description: Remarks updated }
 *       403: { description: Not a manual admin entry }
 *   delete:
 *     summary: Reverse a manual admin entry
 *     description: >
 *       Writes an opposite entry instead of deleting the row, so the balance is
 *       corrected without a hole in the statement.
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Added to the wrong branch" }
 *     responses:
 *       200: { description: Entry reversed }
 *       402: { description: Branch balance too low to take the credit back }
 *       409: { description: Already reversed }
 */
router.get('/transactions/:transactionId', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), (0, validate_middleware_1.validate)(branchWallet_validator_1.walletTransactionByIdSchema), branchWallet_controller_1.getWalletTransaction);
router.patch('/transactions/:transactionId', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'update'), (0, validate_middleware_1.validate)(branchWallet_validator_1.updateWalletTransactionSchema), branchWallet_controller_1.updateWalletTransaction);
router.delete('/transactions/:transactionId', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'delete'), (0, validate_middleware_1.validate)(branchWallet_validator_1.reverseWalletTransactionSchema), branchWallet_controller_1.reverseWalletTransaction);
/**
 * @swagger
 * /admin/branch-wallet/{branchId}:
 *   get:
 *     summary: One branch's wallet, profit percentage and settlement totals
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema: { type: string }
 *         description: Branch (Agency) ObjectId
 *     responses:
 *       200: { description: Wallet details }
 *       404: { description: Branch not found }
 */
router.get('/:branchId', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), (0, validate_middleware_1.validate)(branchWallet_validator_1.branchWalletByIdSchema), branchWallet_controller_1.getBranchWallet);
/**
 * @swagger
 * /admin/branch-wallet/{branchId}/credit:
 *   post:
 *     summary: Add wallet amount to a branch (admin top-up)
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, example: 5000 }
 *               remarks: { type: string, example: "Opening balance for August" }
 *               paymentMethod: { type: string, example: "cash" }
 *               reference: { type: string, example: "NEFT-88213" }
 *     responses:
 *       201: { description: Amount added; returns the new balance }
 *       400: { description: Validation error / branch inactive }
 *       404: { description: Branch not found }
 */
router.post('/:branchId/credit', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'write'), (0, validate_middleware_1.validate)(branchWallet_validator_1.creditBranchWalletSchema), branchWallet_controller_1.creditBranchWallet);
/**
 * @swagger
 * /admin/branch-wallet/{branchId}/debit:
 *   post:
 *     summary: Deduct wallet amount from a branch (manual correction)
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, example: 250 }
 *               remarks: { type: string, example: "Excess credit adjusted" }
 *               reference: { type: string }
 *     responses:
 *       201: { description: Amount deducted; returns the new balance }
 *       402: { description: Insufficient wallet balance }
 *       404: { description: Branch not found }
 */
router.post('/:branchId/debit', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'write'), (0, validate_middleware_1.validate)(branchWallet_validator_1.debitBranchWalletSchema), branchWallet_controller_1.debitBranchWallet);
/**
 * @swagger
 * /admin/branch-wallet/{branchId}/transactions:
 *   get:
 *     summary: A branch's wallet statement
 *     tags: [Wallet Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema: { type: string }
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
router.get('/:branchId/transactions', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'read'), (0, validate_middleware_1.validate)(branchWallet_validator_1.branchWalletByIdSchema), branchWallet_controller_1.getBranchWalletTransactions);
/**
 * @swagger
 * /admin/agency-wallet/{agencyId}/percentage:
 *   patch:
 *     summary: Set an agency's commission, loading and miscellaneous percentages
 *     description: >
 *       The three percentages an agency is booked under, all on one wallet
 *       screen. `profitPercentage` is the share of each booking total the agency
 *       keeps; the remainder is debited from its wallet to the admin settlement
 *       wallet. `loadingChargePercentage` and `miscChargePercentage` are added
 *       on top of the transportation charge at booking time — transport ₹100 at
 *       10% each gives loading ₹10 + miscellaneous ₹10 for a ₹120 total, and the
 *       commission split applies to that total.
 *
 *
 *       Every field is optional; send only what is changing. All of them apply
 *       to new bookings — settlements and invoices already raised keep the
 *       percentages they were booked under.
 *
 *
 *       These percentages are reported back by the admin wallet endpoints only.
 *       The agency's own screens show the resulting rupee amounts on each order
 *       and invoice instead.
 *     tags: [Wallet Flow - Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: agencyId
 *         required: true
 *         schema: { type: string }
 *         description: Agency ObjectId (the path segment is `branchId` on the deprecated alias)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profitPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *               loadingChargePercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *               miscChargePercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *     responses:
 *       200: { description: Percentages updated }
 *       400: { description: No percentage sent, or commission set on an Own agency }
 *       404: { description: Agency not found }
 */
router.patch('/:branchId/percentage', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.wallet_management, 'update'), (0, validate_middleware_1.validate)(branchWallet_validator_1.updateBranchPercentagesSchema), branchWallet_controller_1.updateBranchPercentages);
exports.default = router;
