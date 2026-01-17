"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const franchise_staff_controller_1 = require("../../controllers/admin/franchise-staff.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const staff_validator_1 = require("../../validators/admin/staff.validator");
const router = (0, express_1.Router)();
// All routes require authentication (franchise JWT token)
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /admin/franchise/staff:
 *   get:
 *     summary: Get all staff for logged-in franchise
 *     tags: [Franchise Staff Management]
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
 *         description: Unauthorized - franchise login required
 *   post:
 *     summary: Create a new staff member for logged-in franchise
 *     tags: [Franchise Staff Management]
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
 *               - roleId
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
 *         description: Unauthorized - franchise login required
 */
router.get('/', franchise_staff_controller_1.getFranchiseStaff);
router.post('/', (0, validate_middleware_1.validate)(staff_validator_1.createStaffSchema), franchise_staff_controller_1.createFranchiseStaff);
/**
 * @swagger
 * /admin/franchise/staff/{id}:
 *   get:
 *     summary: Get staff by ID (only if belongs to franchise)
 *     tags: [Franchise Staff Management]
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
 *         description: Access denied - staff does not belong to your franchise
 *       404:
 *         description: Staff not found
 *   put:
 *     summary: Update staff (only if belongs to franchise)
 *     tags: [Franchise Staff Management]
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
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       403:
 *         description: Access denied - staff does not belong to your franchise
 *       404:
 *         description: Staff not found
 *   delete:
 *     summary: Delete staff (only if belongs to franchise)
 *     tags: [Franchise Staff Management]
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
 *         description: Access denied - staff does not belong to your franchise
 *       404:
 *         description: Staff not found
 */
router.get('/:id', (0, validate_middleware_1.validate)(staff_validator_1.getStaffByIdSchema), franchise_staff_controller_1.getFranchiseStaffById);
router.put('/:id', (0, validate_middleware_1.validate)(staff_validator_1.updateStaffSchema), franchise_staff_controller_1.updateFranchiseStaff);
router.delete('/:id', (0, validate_middleware_1.validate)(staff_validator_1.deleteStaffSchema), franchise_staff_controller_1.deleteFranchiseStaff);
/**
 * @swagger
 * /admin/franchise/staff/{id}/status:
 *   patch:
 *     summary: Update staff status (only if belongs to franchise)
 *     tags: [Franchise Staff Management]
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
 *         description: Access denied - staff does not belong to your franchise
 *       404:
 *         description: Staff not found
 */
router.patch('/:id/status', (0, validate_middleware_1.validate)(staff_validator_1.updateStaffStatusSchema), franchise_staff_controller_1.updateFranchiseStaffStatus);
exports.default = router;
