import { Router } from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
} from '../../controllers/admin/vehicle.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  getVehicleByIdSchema,
  deleteVehicleSchema,
} from '../../validators/admin/vehicle.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// All vehicle management endpoints require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /admin/vehicle:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicle Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleType, capacity, vehicleRegistrationNumber, rcNumber, insuranceNumber]
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 example: Truck
 *               capacity:
 *                 type: string
 *                 example: 10 Ton
 *               vehicleRegistrationNumber:
 *                 type: string
 *                 example: TN01AB1234
 *               rcNumber:
 *                 type: string
 *                 example: RC123456789
 *               insuranceNumber:
 *                 type: string
 *                 example: INS987654321
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error or vehicle already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *   get:
 *     summary: Get all vehicles with pagination and filters
 *     tags: [Vehicle Management]
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
 *         description: List of vehicles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 */
// Create new vehicle
router.post(
  '/',
  checkPermission(adminModule.vehicle_management, 'write'),
  validate(createVehicleSchema),
  createVehicle
);

// Get all vehicles with pagination and filters
router.get(
  '/',
  checkPermission(adminModule.vehicle_management, 'read'),
  getAllVehicles
);

/**
 * @swagger
 * /admin/vehicle/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicle Management]
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
 *         description: Vehicle details
 *       404:
 *         description: Vehicle not found
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicle Management]
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
 *               vehicleType:
 *                 type: string
 *               capacity:
 *                 type: string
 *               vehicleRegistrationNumber:
 *                 type: string
 *               rcNumber:
 *                 type: string
 *               insuranceNumber:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Vehicle Management]
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
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 */
// Get vehicle by ID
router.get(
  '/:id',
  checkPermission(adminModule.vehicle_management, 'read'),
  validate(getVehicleByIdSchema),
  getVehicleById
);

// Update vehicle
router.put(
  '/:id',
  checkPermission(adminModule.vehicle_management, 'update'),
  validate(updateVehicleSchema),
  updateVehicle
);

/**
 * @swagger
 * /admin/vehicle/{id}/status:
 *   patch:
 *     summary: Update vehicle status
 *     tags: [Vehicle Management]
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
 *         description: Vehicle not found
 */
// Update vehicle status
router.patch(
  '/:id/status',
  checkPermission(adminModule.vehicle_management, 'update'),
  validate(updateVehicleStatusSchema),
  updateVehicleStatus
);

// Delete vehicle
router.delete(
  '/:id',
  checkPermission(adminModule.vehicle_management, 'delete'),
  validate(deleteVehicleSchema),
  deleteVehicle
);

export default router;
