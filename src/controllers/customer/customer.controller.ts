import { Request, Response } from 'express';
import { customerService } from '../../services/customer.service';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const result = await customerService.createCustomer(req.body);

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

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const result = await customerService.getAllCustomers(page, limit, search, status);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customerService.getCustomerById(id as string);

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customerService.updateCustomer(id as string, req.body);

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

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customerService.deleteCustomer(id as string);

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
