"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agency_controller_1 = require("../../controllers/admin/agency.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const agency_validator_1 = require("../../validators/admin/agency.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const objectIdParam_middleware_1 = require("../../middleware/objectIdParam.middleware");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
// `/:id` below would otherwise swallow every unmatched sub-path and answer
// "Access denied" from the permission check instead of a plain 404
router.param('id', (0, objectIdParam_middleware_1.objectIdParam)('/admin/agency'));
// Public routes - OTP login only
router.post('/login/send-otp', (0, validate_middleware_1.validate)(agency_validator_1.franchiseSendOtpSchema), agency_controller_1.sendFranchiseOtp);
router.post('/login/verify-otp', (0, validate_middleware_1.validate)(agency_validator_1.franchiseVerifyOtpSchema), agency_controller_1.verifyFranchiseOtp);
// All other routes require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /admin/agency:
 *   post:
 *     summary: Create a new agency
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Agency'
 *     responses:
 *       201:
 *         description: Agency created successfully
 *       400:
 *         description: Validation error or agency already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *   get:
 *     summary: Get all agencies with pagination and filters
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: List of agencies
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 */
// Create new agency
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'write'), (0, validate_middleware_1.validate)(agency_validator_1.createAgencySchema), agency_controller_1.createAgency);
// Get all agencies with pagination and filters
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'read'), agency_controller_1.getAllAgencies);
/**
 * @swagger
 * /admin/agency/{id}:
 *   get:
 *     summary: Get agency by ID
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agency details
 *       404:
 *         description: Agency not found
 *   put:
 *     summary: Update agency
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Agency'
 *     responses:
 *       200:
 *         description: Agency updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Agency not found
 *   delete:
 *     summary: Delete agency (staff are auto-reassigned to another agency)
 *     description: >
 *       Any agency staff assigned to this agency are moved to another active agency
 *       before the agency is removed. The target agency is picked automatically (same
 *       city, then same state, then any active agency) unless reassignAgencyId is
 *       supplied. Franchise-scoped roles are remapped to the same role name in the
 *       target agency, or cleared if it has none. The delete is rejected when staff
 *       exist and no other active agency is available.
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reassignAgencyId
 *         required: false
 *         schema:
 *           type: string
 *         description: Agency to move this agency's staff to. Auto-selected when omitted.
 *     responses:
 *       200:
 *         description: Agency deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reassignedStaffCount:
 *                       type: number
 *                     reassignedToAgency:
 *                       type: object
 *                       nullable: true
 *       400:
 *         description: No active agency available for the staff, or invalid reassignAgencyId
 *       404:
 *         description: Agency not found
 */
// Get agency by ID
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'read'), (0, validate_middleware_1.validate)(agency_validator_1.getAgencyByIdSchema), agency_controller_1.getAgencyById);
// Update agency
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'update'), (0, validate_middleware_1.validate)(agency_validator_1.updateAgencySchema), agency_controller_1.updateAgency);
/**
 * @swagger
 * /admin/agency/{id}/status:
 *   patch:
 *     summary: Update agency status
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Agency not found
 */
// Update agency status
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'update'), (0, validate_middleware_1.validate)(agency_validator_1.updateAgencyStatusSchema), agency_controller_1.updateAgencyStatus);
/**
 * @swagger
 * /admin/agency/{id}/profit-percentage:
 *   patch:
 *     summary: Set the branch profit percentage
 *     description: >
 *       Share of every parcel booking amount this branch keeps. The remainder
 *       is debited from the branch wallet and credited to the admin settlement
 *       wallet on each booking — a ₹200 booking at 10% leaves ₹20 with the
 *       branch and sends ₹180 to admin. Applies to new bookings only;
 *       settlements already recorded keep the percentage they were booked under.
 *
 *
 *       The loading and miscellaneous charge percentages are not set here — they
 *       belong to the wallet module:
 *       `PATCH /admin/agency-wallet/{agencyId}/percentage`.
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Branch (Agency) ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profitPercentage]
 *             properties:
 *               profitPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 10
 *     responses:
 *       200:
 *         description: Profit percentage updated
 *       400:
 *         description: Validation error / agency not found
 */
router.patch('/:id/profit-percentage', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'update'), (0, validate_middleware_1.validate)(agency_validator_1.updateAgencyProfitPercentageSchema), agency_controller_1.updateAgencyProfitPercentage);
// Delete agency
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.agency_management, 'delete'), (0, validate_middleware_1.validate)(agency_validator_1.deleteAgencySchema), agency_controller_1.deleteAgency);
exports.default = router;
