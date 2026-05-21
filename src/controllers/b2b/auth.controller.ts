import { Request, Response } from 'express';
import { staffService } from '../../services/admin/staff.service';

export const sendB2bOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const result = await staffService.sendB2bOtp(phone, countryCode);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const verifyB2bOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode, otp } = req.body;
    const result = await staffService.verifyB2bOtp(phone, countryCode, otp);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
