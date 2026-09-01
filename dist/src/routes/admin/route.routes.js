"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const route_controller_1 = require("../../controllers/admin/route.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const route_validator_1 = require("../../validators/admin/route.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const router = (0, express_1.Router)();
// All route management endpoints require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /admin/route:
 *   post:
 *     summary: Create a new route
 *     tags: [Route Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [routeName, from, to]
 *             properties:
 *               routeName:
 *                 type: string
 *                 example: Chennai - Bangalore Express
 *               from:
 *                 type: string
 *                 example: Chennai
 *               to:
 *                 type: string
 *                 example: Bangalore
 *               branches:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Guindy", "Tambaram"]
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Route created successfully
 *       400:
 *         description: Validation error or route already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *   get:
 *     summary: Get all routes with pagination and filters
 *     tags: [Route Management]
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
 *         description: List of routes
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 */
// Create new route
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'write'), (0, validate_middleware_1.validate)(route_validator_1.createRouteSchema), route_controller_1.createRoute);
// Get all routes with pagination and filters
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'read'), route_controller_1.getAllRoutes);
/**
 * @swagger
 * /admin/route/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Route Management]
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
 *         description: Route details
 *       404:
 *         description: Route not found
 *   put:
 *     summary: Update route
 *     tags: [Route Management]
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
 *               routeName:
 *                 type: string
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               branches:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Route updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Route not found
 *   delete:
 *     summary: Delete route
 *     tags: [Route Management]
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
 *         description: Route deleted successfully
 *       404:
 *         description: Route not found
 */
// Get route by ID
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'read'), (0, validate_middleware_1.validate)(route_validator_1.getRouteByIdSchema), route_controller_1.getRouteById);
// Update route
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'update'), (0, validate_middleware_1.validate)(route_validator_1.updateRouteSchema), route_controller_1.updateRoute);
/**
 * @swagger
 * /admin/route/{id}/status:
 *   patch:
 *     summary: Update route status
 *     tags: [Route Management]
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
 *         description: Route not found
 */
// Update route status
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'update'), (0, validate_middleware_1.validate)(route_validator_1.updateRouteStatusSchema), route_controller_1.updateRouteStatus);
/**
 * @swagger
 * /admin/route/{id}/branches:
 *   patch:
 *     summary: Update the branch list of a route (Branch Management)
 *     tags: [Route Management]
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
 *             required: [branches]
 *             properties:
 *               branches:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Chengalpattu", "Villupuram", "Trichy", "Erode"]
 *     responses:
 *       200:
 *         description: Branches updated successfully
 *       404:
 *         description: Route not found
 */
// Update route branches (Branch Management)
router.patch('/:id/branches', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'update'), (0, validate_middleware_1.validate)(route_validator_1.updateRouteBranchesSchema), route_controller_1.updateRouteBranches);
// Delete route
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.route_management, 'delete'), (0, validate_middleware_1.validate)(route_validator_1.deleteRouteSchema), route_controller_1.deleteRoute);
exports.default = router;
