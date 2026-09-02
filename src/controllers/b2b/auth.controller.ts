import { Request, Response } from 'express';
import { b2bAuthService } from '../../services/b2b/auth.service';
import { staffService } from '../../services/admin/staff.service';
import { B2bUser } from '../../models/b2b/b2bUser.model';

const normalizeMobile = (value: any) => String(value || '').replace(/\D/g, '').slice(-10);

export const sendB2bOtp = async (req: Request, res: Response) => {
  const rawMobileNumber = req.body.mobileNumber || req.body.phone;
  const mobileNumber = normalizeMobile(rawMobileNumber);
  const countryCode = req.body.countryCode || '+91';
  const b2bUser = mobileNumber ? await B2bUser.findOne({ mobileNumber, status: 'Active' }) : null;
  if (!b2bUser && !req.body.mobileNumber) {
    const { phone, countryCode } = req.body;
    const result = await staffService.sendB2bOtp(phone, countryCode);
    return res.status(result.success ? 200 : 400).json(result);
  }
  const result = await b2bAuthService.sendOtp(String(mobileNumber), String(countryCode));
  return res.status(result.success ? 200 : 400).json(result);
};

export const verifyB2bOtp = async (req: Request, res: Response) => {
  const rawMobileNumber = req.body.mobileNumber || req.body.phone;
  const mobileNumber = normalizeMobile(rawMobileNumber);
  const b2bUser = mobileNumber ? await B2bUser.findOne({ mobileNumber, status: 'Active' }) : null;
  if (!b2bUser && !req.body.mobileNumber) {
    const { phone, countryCode, otp } = req.body;
    const result = await staffService.verifyB2bOtp(phone, countryCode, otp);
    return res.status(result.success ? 200 : 401).json(result);
  }
  const result = await b2bAuthService.verifyOtp(String(mobileNumber), req.body.otp);
  return res.status(result.success ? 200 : 401).json(result);
};
