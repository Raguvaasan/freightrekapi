import { Request, Response } from 'express';
import * as customerEmailAuthService from '../../services/customerEmailAuth.service';

export const signup = async (req: Request, res: Response) => {
  try {
    const result = await customerEmailAuthService.signup(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await customerEmailAuthService.login(req.body);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
