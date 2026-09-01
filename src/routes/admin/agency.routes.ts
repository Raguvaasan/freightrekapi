import { Router } from 'express';
import {
  createAgency,
  getAllAgencies,
  getAgencyById,
  updateAgency,
  deleteAgency,
  updateAgencyStatus,
  updateAgencyProfitPercentage,
  sendFranchiseOtp,
  verifyFranchiseOtp,
} from '../../controllers/admin/agency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAgencySchema,
  updateAgencySchema,
  updateAgencyStatusSchema,
  updateAgencyProfitPercentageSchema,
  getAgencyByIdSchema,
  deleteAgencySchema,
  franchiseSendOtpSchema,
  franchiseVerifyOtpSchema,
} from '../../validators/admin/agency.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { objectIdParam } from '../../middleware/objectIdParam.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// `/:id` below would otherwise swallow every unmatched sub-path and answer
// "Access denied" from the permission check instead of a plain 404
router.param('id', objectIdParam('/admin/agency'));

// Public routes - OTP login only
router.post('/login/send-otp', validate(franchiseSendOtpSchema), sendFranchiseOtp);
router.post('/login/verify-otp', validate(franchiseVerifyOtpSchema), verifyFranchiseOtp);

// All other routes require authentication
router.use(authMiddleware);

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
router.post(
  '/',
  checkPermission(adminModule.agency_management, 'write'),
  validate(createAgencySchema),
  createAgency
);

// Get all agencies with pagination and filters
router.get(
  '/',
  checkPermission(adminModule.agency_management, 'read'),
  getAllAgencies
);

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
router.get(
  '/:id',
  checkPermission(adminModule.agency_management, 'read'),
  validate(getAgencyByIdSchema),
  getAgencyById
);

// Update agency
router.put(
  '/:id',
  checkPermission(adminModule.agency_management, 'update'),
  validate(updateAgencySchema),
  updateAgency
);

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
router.patch(
  '/:id/status',
  checkPermission(adminModule.agency_management, 'update'),
  validate(updateAgencyStatusSchema),
  updateAgencyStatus
);

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
router.patch(
  '/:id/profit-percentage',
  checkPermission(adminModule.agency_management, 'update'),
  validate(updateAgencyProfitPercentageSchema),
  updateAgencyProfitPercentage
);

// Delete agency
router.delete(
  '/:id',
  checkPermission(adminModule.agency_management, 'delete'),
  validate(deleteAgencySchema),
  deleteAgency
);

export default router;
