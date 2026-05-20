import { Request, Response } from 'express';
import * as customerUserService from '../../services/admin/customerUser.service';

export const getAllCustomerUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await customerUserService.getAllCustomerUsers(page, limit);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCustomerUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customerUserService.updateCustomerUser(id, req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCustomerUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customerUserService.deleteCustomerUser(id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
