import { Router } from 'express';
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
} from '../../controllers/admin/driver.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  getDriverByIdSchema,
  deleteDriverSchema,
} from '../../validators/admin/driver.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// All driver management endpoints require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /admin/driver:
 *   post:
 *     summary: Create a new driver
 *     tags: [Driver Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [driverName, phoneNumber, licenseNumber, dateOfExpiry]
 *             properties:
 *               driverName:
 *                 type: string
 *                 example: Ramesh Kumar
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *               licenseNumber:
 *                 type: string
 *                 example: TN1420110012345
 *               dateOfExpiry:
 *                 type: string
 *                 format: date
 *                 example: 2028-05-31
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       400:
 *         description: Validation error or driver already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *   get:
 *     summary: Get all drivers with pagination and filters
 *     tags: [Driver Management]
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
 *         description: List of drivers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 */
// Create new driver
router.post(
  '/',
  checkPermission(adminModule.driver_management, 'write'),
  validate(createDriverSchema),
  createDriver
);

// Get all drivers with pagination and filters
router.get(
  '/',
  checkPermission(adminModule.driver_management, 'read'),
  getAllDrivers
);

/**
 * @swagger
 * /admin/driver/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Driver Management]
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
 *         description: Driver details
 *       404:
 *         description: Driver not found
 *   put:
 *     summary: Update driver
 *     tags: [Driver Management]
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
 *               driverName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               dateOfExpiry:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Driver not found
 *   delete:
 *     summary: Delete driver
 *     tags: [Driver Management]
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
 *         description: Driver deleted successfully
 *       404:
 *         description: Driver not found
 */
// Get driver by ID
router.get(
  '/:id',
  checkPermission(adminModule.driver_management, 'read'),
  validate(getDriverByIdSchema),
  getDriverById
);

// Update driver
router.put(
  '/:id',
  checkPermission(adminModule.driver_management, 'update'),
  validate(updateDriverSchema),
  updateDriver
);

/**
 * @swagger
 * /admin/driver/{id}/status:
 *   patch:
 *     summary: Update driver status
 *     tags: [Driver Management]
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
 *         description: Driver not found
 */
// Update driver status
router.patch(
  '/:id/status',
  checkPermission(adminModule.driver_management, 'update'),
  validate(updateDriverStatusSchema),
  updateDriverStatus
);

// Delete driver
router.delete(
  '/:id',
  checkPermission(adminModule.driver_management, 'delete'),
  validate(deleteDriverSchema),
  deleteDriver
);

export default router;
