"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../../controllers/admin/vehicle.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const vehicle_validator_1 = require("../../validators/admin/vehicle.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
// All vehicle management endpoints require authentication
router.use(auth_middleware_1.authMiddleware);
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
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.vehicle_management, 'write'), (0, validate_middleware_1.validate)(vehicle_validator_1.createVehicleSchema), vehicle_controller_1.createVehicle);
// Get all vehicles with pagination and filters
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.vehicle_management, 'read'), vehicle_controller_1.getAllVehicles);
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
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.vehicle_management, 'read'), (0, validate_middleware_1.validate)(vehicle_validator_1.getVehicleByIdSchema), vehicle_controller_1.getVehicleById);
// Update vehicle
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.vehicle_management, 'update'), (0, validate_middleware_1.validate)(vehicle_validator_1.updateVehicleSchema), vehicle_controller_1.updateVehicle);
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
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.vehicle_management, 'update'), (0, validate_middleware_1.validate)(vehicle_validator_1.updateVehicleStatusSchema), vehicle_controller_1.updateVehicleStatus);
// Delete vehicle
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.vehicle_management, 'delete'), (0, validate_middleware_1.validate)(vehicle_validator_1.deleteVehicleSchema), vehicle_controller_1.deleteVehicle);
exports.default = router;
