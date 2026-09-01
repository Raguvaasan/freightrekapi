import { Router, Request, Response } from 'express';
import * as yup from 'yup';
import { unifiedAuthService } from '../../services/admin/unifiedAuth.service';
import { validate } from '../../middleware/validate.middleware';

/**
 * Single login for every internal user — base: /admin/login
 *
 * One phone number field on one screen. The account type (agency / hub / staff /
 * admin) is resolved from the number, and the response says which module the
 * frontend should land the user in.
 */
const router = Router();

const phoneBody = {
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .trim(),
  countryCode: yup.string().default('+91').trim(),
};

const sendOtpSchema = yup.object({ body: yup.object(phoneBody) });

const verifyOtpSchema = yup.object({
  body: yup.object({
    ...phoneBody,
    otp: yup
      .string()
      .required('OTP is required')
      .matches(/^[0-9]{6}$/, 'OTP must be 6 digits'),
  }),
});

const lookupSchema = yup.object({ body: yup.object(phoneBody) });

const fail = (res: Response, result: any, fallback = 400) =>
  res.status(result.code || fallback).json({
    success: false,
    message: result.message,
  });

/**
 * @swagger
 * /admin/login/send-otp:
 *   post:
 *     summary: Single login - send OTP to a phone number
 *     description: >
 *       Works for agency, hub, staff and admin logins. The phone number is
 *       unique across all of them, so no user type has to be chosen. The
 *       response includes the resolved userType and module so the UI can show
 *       who is logging in.
 *     tags: [Unified Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "9876543210" }
 *               countryCode: { type: string, default: "+91" }
 *     responses:
 *       200:
 *         description: OTP sent; returns { userType, module }
 *       403: { description: Account is inactive }
 *       404: { description: No account with this phone number }
 */
router.post('/send-otp', validate(sendOtpSchema), async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const result = await unifiedAuthService.sendLoginOtp(phone, countryCode || '+91');

    if (!result.success) return fail(res, result);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /admin/login/verify-otp:
 *   post:
 *     summary: Single login - verify OTP and get a token
 *     description: >
 *       Returns the JWT plus `userType` (admin | agency | hub | staff),
 *       `staffType` for staff, and `module` (admin | agency | hub) telling the
 *       frontend which area to open.
 *     tags: [Unified Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone: { type: string, example: "9876543210" }
 *               countryCode: { type: string, default: "+91" }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: >
 *           { token, data: { userType, staffType, module, name, agencyId,
 *           agencyName, hubId, hubName, user } }
 *       400: { description: OTP missing or expired }
 *       401: { description: Invalid OTP }
 *       403: { description: Account is inactive }
 */
router.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  async (req: Request, res: Response) => {
    try {
      const { phone, countryCode, otp } = req.body;
      const result = await unifiedAuthService.verifyLoginOtp(
        phone,
        countryCode || '+91',
        otp
      );

      if (!result.success) return fail(res, result, 401);

      return res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        data: result.data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /admin/login/lookup:
 *   post:
 *     summary: Which account does this phone number belong to (no OTP sent)
 *     tags: [Unified Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "9876543210" }
 *     responses:
 *       200: { description: "{ userType, staffType, module, name, active }" }
 *       404: { description: No account with this phone number }
 */
router.post('/lookup', validate(lookupSchema), async (req: Request, res: Response) => {
  try {
    const result = await unifiedAuthService.lookupPhone(req.body.phone);
    if (!result.success) return fail(res, result, 404);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
});

export default router;
