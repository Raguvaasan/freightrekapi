"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("../../controllers/admin/staff.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const staff_validator_1 = require("../../validators/admin/staff.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
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
router.post('/login', (0, validate_middleware_1.validate)(staff_validator_1.staffLoginSchema), staff_controller_1.loginStaff);
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
router.post('/login/franchise', (0, validate_middleware_1.validate)(staff_validator_1.staffLoginSchema), staff_controller_1.loginFranchiseStaff);
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
router.post('/login/headquarter', (0, validate_middleware_1.validate)(staff_validator_1.staffLoginSchema), staff_controller_1.loginHeadQuarterStaff);
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
router.post('/login/hub', (0, validate_middleware_1.validate)(staff_validator_1.staffLoginSchema), staff_controller_1.loginHubStaff);
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
router.get('/', staff_controller_1.getAllStaff);
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
router.get('/:id', (0, validate_middleware_1.validate)(staff_validator_1.getStaffByIdSchema), staff_controller_1.getStaffById);
// All other routes require authentication
router.use(auth_middleware_1.authMiddleware);
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
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'write'), (0, validate_middleware_1.validate)(staff_validator_1.createStaffSchema), staff_controller_1.createStaff);
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
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'write'), (0, validate_middleware_1.validate)(staff_validator_1.updateStaffSchema), staff_controller_1.updateStaff);
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'delete'), (0, validate_middleware_1.validate)(staff_validator_1.deleteStaffSchema), staff_controller_1.deleteStaff);
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
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'write'), (0, validate_middleware_1.validate)(staff_validator_1.updateStaffStatusSchema), staff_controller_1.updateStaffStatus);
exports.default = router;
