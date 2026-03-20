import { Router } from 'express';
import { register, sendOtp, verifyOtp } from '../../controllers/customer/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import {
  customerRegisterSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../../validators/customerAuth.validator';

const router = Router();

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
 *               - password
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
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                   example: Registration successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         countryCode:
 *                           type: string
 *                         status:
 *                           type: string
 *       400:
 *         description: Validation error or duplicate account
 *       500:
 *         description: Internal server error
 */
router.post('/register', validate(customerRegisterSchema), register);

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
router.post('/send-otp', validate(sendOtpSchema), sendOtp);

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
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

export default router;
