import { Router } from 'express';
import {
  createAgency,
  getAllAgencies,
  getAgencyById,
  updateAgency,
  deleteAgency,
  getAgenciesByHub,
  updateAgencyStatus,
} from '../../controllers/admin/agency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAgencySchema,
  updateAgencySchema,
  updateAgencyStatusSchema,
  getAgencyByIdSchema,
  deleteAgencySchema,
  getAgenciesByHubSchema,
} from '../../validators/admin/agency.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// All routes require authentication
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
 *       - in: query
 *         name: hubId
 *         schema:
 *           type: string
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

/**
 * @swagger
 * /admin/agency/hub/{hubId}:
 *   get:
 *     summary: Get all agencies assigned to a specific hub
 *     tags: [Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hubId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of agencies for the hub
 *       400:
 *         description: Invalid hub ID
 */
// Get agencies by hub
router.get(
  '/hub/:hubId',
  checkPermission(adminModule.agency_management, 'read'),
  validate(getAgenciesByHubSchema),
  getAgenciesByHub
);

export default router;
