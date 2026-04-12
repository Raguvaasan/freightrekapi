import { Router } from 'express';
import {
  createAgency,
  getAllAgencies,
  getAgencyById,
  updateAgency,
  deleteAgency,
  updateAgencyStatus,
  loginFranchise,
  sendFranchiseOtp,
  verifyFranchiseOtp,
} from '../../controllers/admin/agency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAgencySchema,
  updateAgencySchema,
  updateAgencyStatusSchema,
  getAgencyByIdSchema,
  deleteAgencySchema,
  franchiseLoginSchema,
  franchiseSendOtpSchema,
  franchiseVerifyOtpSchema,
} from '../../validators/admin/agency.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

/**
 * @swagger
 * /admin/agency/login:
 *   post:
 *     summary: Franchise login
 *     tags: [Agency Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 format: email
 *                 example: admin@freightrek.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(franchiseLoginSchema), loginFranchise);
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
 *     summary: Delete agency
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
 *         description: Agency deleted successfully
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

// Delete agency
router.delete(
  '/:id',
  checkPermission(adminModule.agency_management, 'delete'),
  validate(deleteAgencySchema),
  deleteAgency
);

export default router;
