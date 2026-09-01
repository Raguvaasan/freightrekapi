"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../../controllers/admin/driver.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const driver_validator_1 = require("../../validators/admin/driver.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
// All driver management endpoints require authentication
router.use(auth_middleware_1.authMiddleware);
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
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.driver_management, 'write'), (0, validate_middleware_1.validate)(driver_validator_1.createDriverSchema), driver_controller_1.createDriver);
// Get all drivers with pagination and filters
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.driver_management, 'read'), driver_controller_1.getAllDrivers);
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
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.driver_management, 'read'), (0, validate_middleware_1.validate)(driver_validator_1.getDriverByIdSchema), driver_controller_1.getDriverById);
// Update driver
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.driver_management, 'update'), (0, validate_middleware_1.validate)(driver_validator_1.updateDriverSchema), driver_controller_1.updateDriver);
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
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.driver_management, 'update'), (0, validate_middleware_1.validate)(driver_validator_1.updateDriverStatusSchema), driver_controller_1.updateDriverStatus);
// Delete driver
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.driver_management, 'delete'), (0, validate_middleware_1.validate)(driver_validator_1.deleteDriverSchema), driver_controller_1.deleteDriver);
exports.default = router;
