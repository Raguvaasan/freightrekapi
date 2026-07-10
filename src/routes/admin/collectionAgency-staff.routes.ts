import { Router } from 'express';
import {
  getCollectionAgencyStaff,
  getCollectionAgencyStaffById,
  createCollectionAgencyStaff,
  updateCollectionAgencyStaff,
  updateCollectionAgencyStaffStatus,
  deleteCollectionAgencyStaff,
} from '../../controllers/admin/collectionAgency-staff.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createCollectionAgencyStaffSchema,
  updateCollectionAgencyStaffSchema,
} from '../../validators/admin/collectionAgencyStaff.validator';
import {
  updateStaffStatusSchema,
  getStaffByIdSchema,
  deleteStaffSchema,
} from '../../validators/admin/staff.validator';

const router = Router();

// All routes require authentication (collection agency JWT token)
router.use(authMiddleware);

/**
 * @swagger
 * /admin/collection-agency/staff:
 *   get:
 *     summary: Get all staff for logged-in collection agency
 *     tags: [Collection Agency Staff Management]
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
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
 *       401:
 *         description: Unauthorized - collection agency login required
 *   post:
 *     summary: Create a new staff member for logged-in collection agency
 *     tags: [Collection Agency Staff Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - username
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               roleId:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 default: Active
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Validation error or staff already exists
 *       401:
 *         description: Unauthorized - collection agency login required
 */
router.get('/', getCollectionAgencyStaff);
router.post('/', validate(createCollectionAgencyStaffSchema), createCollectionAgencyStaff);

/**
 * @swagger
 * /admin/collection-agency/staff/{id}:
 *   get:
 *     summary: Get staff by ID (only if belongs to collection agency)
 *     tags: [Collection Agency Staff Management]
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
 *         description: Staff details
 *       403:
 *         description: Access denied - staff does not belong to your collection agency
 *       404:
 *         description: Staff not found
 *   put:
 *     summary: Update staff (only if belongs to collection agency)
 *     tags: [Collection Agency Staff Management]
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
 *         description: Staff updated successfully
 *       403:
 *         description: Access denied - staff does not belong to your collection agency
 *       404:
 *         description: Staff not found
 *   delete:
 *     summary: Delete staff (only if belongs to collection agency)
 *     tags: [Collection Agency Staff Management]
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
 *       403:
 *         description: Access denied - staff does not belong to your collection agency
 *       404:
 *         description: Staff not found
 */
router.get('/:id', validate(getStaffByIdSchema), getCollectionAgencyStaffById);
router.put('/:id', validate(updateCollectionAgencyStaffSchema), updateCollectionAgencyStaff);
router.delete('/:id', validate(deleteStaffSchema), deleteCollectionAgencyStaff);

/**
 * @swagger
 * /admin/collection-agency/staff/{id}/status:
 *   patch:
 *     summary: Update staff status (only if belongs to collection agency)
 *     tags: [Collection Agency Staff Management]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Staff status updated successfully
 *       403:
 *         description: Access denied - staff does not belong to your collection agency
 *       404:
 *         description: Staff not found
 */
router.patch('/:id/status', validate(updateStaffStatusSchema), updateCollectionAgencyStaffStatus);

export default router;
