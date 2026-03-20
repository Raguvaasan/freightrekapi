import { Request, Response } from 'express';
import { customerAuthService } from '../../services/customerAuth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await customerAuthService.register(req.body);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const result = await customerAuthService.sendOtp(phone, countryCode);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode, otp } = req.body;
    const result = await customerAuthService.verifyOtp(phone, countryCode, otp);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
