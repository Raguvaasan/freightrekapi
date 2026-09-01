import { Router } from 'express';
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  updateRouteStatus,
  updateRouteBranches,
  deleteRoute,
} from '../../controllers/admin/route.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createRouteSchema,
  updateRouteSchema,
  updateRouteStatusSchema,
  updateRouteBranchesSchema,
  getRouteByIdSchema,
  deleteRouteSchema,
} from '../../validators/admin/route.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// All route management endpoints require authentication
router.use(authMiddleware);

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
router.post(
  '/',
  checkPermission(adminModule.route_management, 'write'),
  validate(createRouteSchema),
  createRoute
);

// Get all routes with pagination and filters
router.get(
  '/',
  checkPermission(adminModule.route_management, 'read'),
  getAllRoutes
);

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
router.get(
  '/:id',
  checkPermission(adminModule.route_management, 'read'),
  validate(getRouteByIdSchema),
  getRouteById
);

// Update route
router.put(
  '/:id',
  checkPermission(adminModule.route_management, 'update'),
  validate(updateRouteSchema),
  updateRoute
);

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
router.patch(
  '/:id/status',
  checkPermission(adminModule.route_management, 'update'),
  validate(updateRouteStatusSchema),
  updateRouteStatus
);

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
router.patch(
  '/:id/branches',
  checkPermission(adminModule.route_management, 'update'),
  validate(updateRouteBranchesSchema),
  updateRouteBranches
);

// Delete route
router.delete(
  '/:id',
  checkPermission(adminModule.route_management, 'delete'),
  validate(deleteRouteSchema),
  deleteRoute
);

export default router;
