import { Router } from "express";
import * as roleController from "../../controllers/admin/role.controller";
import { validate } from "../../middleware/validate.middleware";
import { createRoleSchema, updateRoleSchema } from "../../validators/admin/role.validator";
import { authMiddleware } from "../../middleware/auth.middleware"
import { checkPermission } from "../../middleware/checkPermission.middleware"
import { adminModule } from "../../config/adminModule"
const router = Router();

/**
 * @swagger
 * /admin/setup/role:
 *   post:
 *     summary: Setup - Create initial role (No auth required)
 *     description: Only works if no roles exist. Use this endpoint for initial setup.
 *     tags: [Setup]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Setup role created successfully
 *       400:
 *         description: Setup already completed or error
 */
router.post("/setup", validate(createRoleSchema), roleController.createRoleSetup);

/**
 * @swagger
 * /admin/role:
 *   post:
 *     summary: Create a new role
 *     tags: [Role Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Error creating role
 *   get:
 *     summary: Get all roles
 *     tags: [Role Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 */
router.post("/", authMiddleware, checkPermission(adminModule.access_management, 'write'), validate(createRoleSchema), roleController.createRole);
router.get("/", authMiddleware, checkPermission(adminModule.access_management, 'read'), roleController.getRoles);

/**
 * @swagger
 * /admin/role/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Role Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *   put:
 *     summary: Update role
 *     tags: [Role Management]
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
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *   delete:
 *     summary: Delete role
 *     tags: [Role Management]
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
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 */
router.get("/:id", authMiddleware, checkPermission(adminModule.access_management, 'read'), roleController.getRolesById);
router.put("/:id", authMiddleware, checkPermission(adminModule.access_management, 'update'), validate(updateRoleSchema), roleController.updateRole);
router.delete("/:id", checkPermission(adminModule.access_management, 'delete'), authMiddleware, roleController.deleteRole);

export default router;
