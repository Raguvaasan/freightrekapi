import { Request, Response } from 'express';
import * as hubManageStaffService from '../../services/hub/hubManageStaff.service';

export const getHubStaff = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const result = await hubManageStaffService.getHubStaff(hubId, page, limit, search);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getHubStaffById = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.getHubStaffById(hubId, req.params.id as string);
    if (!result.success) {
      const status = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createHubStaff = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.createHubStaff(hubId, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHubStaff = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.updateHubStaff(hubId, req.params.id as string, req.body);
    if (!result.success) {
      const status = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteHubStaff = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await hubManageStaffService.deleteHubStaff(hubId, req.params.id as string);
    if (!result.success) {
      const status = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHubStaffStatus = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    if (!hubId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Active or Inactive' });
    }

    const result = await hubManageStaffService.updateHubStaffStatus(hubId, req.params.id as string, status);
    if (!result.success) {
      const status404 = result.message === 'Staff not found' ? 404 : 400;
      return res.status(status404).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
