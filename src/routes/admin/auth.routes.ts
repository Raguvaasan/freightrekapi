import { Router } from "express";
import * as authController from "../../controllers/admin/auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../../validators/admin/auth.validator";
import { authMiddleware } from "../../middleware/auth.middleware";
import { checkPermission } from "../../middleware/checkPermission.middleware";
import { adminModule } from "../../config/adminModule";

const router = Router();

/**
 * @swagger
 * /admin/auth/register:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", validate(registerSchema), authController.register);

router.post("/create-user", authMiddleware, checkPermission(adminModule.access_management, 'write'), validate(registerSchema), authController.register);
/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Login admin user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */router.post("/login", validate(loginSchema), authController.login);

export default router;
