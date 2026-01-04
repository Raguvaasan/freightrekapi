import { Router } from "express";
import * as hubController from "../../controllers/admin/hub.controller";
import { validate } from "../../middleware/validate.middleware";
import { createHubSchema, updateHubSchema } from "../../validators/admin/hub.validator";
import { authMiddleware } from "../../middleware/auth.middleware"
import { checkPermission } from "../../middleware/checkPermission.middleware"
import { adminModule } from "../../config/adminModule"
const router = Router();

/**
 * @swagger
 * /admin/hub:
 *   post:
 *     summary: Create a new freight hub
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hub'
 *     responses:
 *       201:
 *         description: Hub created successfully
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
 *         description: Error creating hub
 *   get:
 *     summary: Get all hubs
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hubs
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
 *                     $ref: '#/components/schemas/Hub'
 */
router.post("/", authMiddleware, checkPermission(adminModule.hub_management, 'write'), validate(createHubSchema), hubController.createHub);
router.get("/", authMiddleware, checkPermission(adminModule.hub_management, 'read'), hubController.getHubs);

/**
 * @swagger
 * /admin/hub/{id}:
 *   get:
 *     summary: Get hub by ID
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hub ID
 *     responses:
 *       200:
 *         description: Hub details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hub'
 *       404:
 *         description: Hub not found
 *   put:
 *     summary: Update hub
 *     tags: [Hub Management]
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
 *             $ref: '#/components/schemas/Hub'
 *     responses:
 *       200:
 *         description: Hub updated successfully
 *       404:
 *         description: Hub not found
 *   delete:
 *     summary: Delete hub
 *     tags: [Hub Management]
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
 *         description: Hub deleted successfully
 *       404:
 *         description: Hub not found
 */
router.get("/:id", authMiddleware, checkPermission(adminModule.hub_management, 'read'), hubController.gethubById);
router.put("/:id", authMiddleware, checkPermission(adminModule.hub_management, 'update'), validate(updateHubSchema), hubController.updateHub);
router.delete("/:id", checkPermission(adminModule.hub_management, 'delete'), authMiddleware, hubController.deleteHub);

export default router;
