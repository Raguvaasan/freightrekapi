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
