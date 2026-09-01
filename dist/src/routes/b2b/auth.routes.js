"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controllers/b2b/auth.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /b2b/auth/send-otp:
 *   post:
 *     summary: Send OTP for B2B Staff Login (Relationship Manager only)
 *     tags: [B2B Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - countryCode
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: No active B2B staff found
 */
router.post('/send-otp', auth_controller_1.sendB2bOtp);
/**
 * @swagger
 * /b2b/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login B2B Staff (Relationship Manager only)
 *     tags: [B2B Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - countryCode
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful with token
 *       401:
 *         description: Invalid OTP or access denied
 */
router.post('/verify-otp', auth_controller_1.verifyB2bOtp);
exports.default = router;
