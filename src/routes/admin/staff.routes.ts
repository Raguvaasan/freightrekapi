import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  loginStaff,
  loginFranchiseStaff,
  loginHeadQuarterStaff,
  loginHubStaff,
} from '../../controllers/admin/staff.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  getStaffByIdSchema,
  deleteStaffSchema,
  staffLoginSchema,
} from '../../validators/admin/staff.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

/**
 * @swagger
 * /admin/staff/login:
 *   post:
 *     summary: Staff login
 *     tags: [Staff Management]
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
 *                 example: staffuser
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
router.post('/login', validate(staffLoginSchema), loginStaff);

/**
 * @swagger
 * /admin/staff/login/franchise:
 *   post:
 *     summary: Franchise staff login (only for franchise staff)
 *     tags: [Staff Management]
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
 *                 example: franchisestaff
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Franchise staff login successful
 *       401:
 *         description: Invalid credentials or not a franchise staff
 */
router.post('/login/franchise', validate(staffLoginSchema), loginFranchiseStaff);

/**
 * @swagger
 * /admin/staff/login/headquarter:
 *   post:
 *     summary: Head quarter staff login (only for HQ staff)
 *     tags: [Staff Management]
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
 *                 example: hqstaff
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Head quarter staff login successful
 *       401:
 *         description: Invalid credentials or not a head quarter staff
 */
router.post('/login/headquarter', validate(staffLoginSchema), loginHeadQuarterStaff);

/**
 * @swagger
 * /admin/staff/login/hub:
 *   post:
 *     summary: Hub staff login (only for hub staff)
 *     tags: [Staff Management]
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
 *                 example: hubstaff
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Hub staff login successful
 *       401:
 *         description: Invalid credentials or not a hub staff
 */
router.post('/login/hub', validate(staffLoginSchema), loginHubStaff);

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Get all staff with pagination (Public)
 *     tags: [Staff Management]
 *     security: []
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
 *       - in: query
 *         name: franchiseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
 */
router.get('/', getAllStaff);

/**
 * @swagger
 * /admin/staff/{id}:
 *   get:
 *     summary: Get staff by ID (Public)
 *     tags: [Staff Management]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff details
 *       404:
 *         description: Staff not found
 */
router.get('/:id', validate(getStaffByIdSchema), getStaffById);

// All other routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /admin/staff:
 *   post:
 *     summary: Create a new staff
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Staff'
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Validation error or staff already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 */
router.post('/', checkPermission(adminModule.access_management, 'write'), validate(createStaffSchema), createStaff);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     summary: Update staff
 *     tags: [Staff Management]
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
 *             $ref: '#/components/schemas/Staff'
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Staff not found
 *   delete:
 *     summary: Delete staff
 *     tags: [Staff Management]
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
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 */
router.put('/:id', checkPermission(adminModule.access_management, 'write'), validate(updateStaffSchema), updateStaff);
router.delete('/:id', checkPermission(adminModule.access_management, 'delete'), validate(deleteStaffSchema), deleteStaff);

/**
 * @swagger
 * /admin/staff/{id}/status:
 *   patch:
 *     summary: Update staff status
 *     tags: [Staff Management]
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
 *         description: Staff not found
 */
router.patch('/:id/status', checkPermission(adminModule.access_management, 'write'), validate(updateStaffStatusSchema), updateStaffStatus);

export default router;
