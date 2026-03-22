"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controllers/customer/auth.controller");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const customerAuth_validator_1 = require("../../validators/customerAuth.validator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/customer/auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - countryCode
 *               - phone
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               countryCode:
 *                 type: string
 *                 example: "+234"
 *               phone:
 *                 type: string
 *                 example: "8012345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully — verify via /verify-otp to complete registration
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
 *                   example: OTP sent to your phone. Please verify to complete registration
 *       400:
 *         description: Validation error or duplicate account
 *       500:
 *         description: Internal server error
 */
router.post('/register', (0, validate_middleware_1.validate)(customerAuth_validator_1.customerRegisterSchema), auth_controller_1.register);
/**
 * @swagger
 * /api/customer/auth/send-otp:
 *   post:
 *     summary: Send OTP to customer phone number for login
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phone
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/send-otp', (0, validate_middleware_1.validate)(customerAuth_validator_1.sendOtpSchema), auth_controller_1.sendOtp);
/**
 * @swagger
 * /api/customer/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login customer
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phone
 *               - otp
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', (0, validate_middleware_1.validate)(customerAuth_validator_1.verifyOtpSchema), auth_controller_1.verifyOtp);
exports.default = router;
