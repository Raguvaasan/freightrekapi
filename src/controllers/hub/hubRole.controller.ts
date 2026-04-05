import { Request, Response } from 'express';
import * as hubRoleService from '../../services/hub/hubRole.service';

export const createHubRole = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;

    if (!hubId) {
      return res.status(401).json({
        success: false,
        message: 'Hub not authenticated',
      });
    }

    const result = await hubRoleService.createHubRole(hubId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHubRoles = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;

    if (!hubId) {
      return res.status(401).json({
        success: false,
        message: 'Hub not authenticated',
      });
    }

    const result = await hubRoleService.getHubRoles(hubId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHubRoleById = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    const roleId = req.params.id;

    if (!hubId) {
      return res.status(401).json({
        success: false,
        message: 'Hub not authenticated',
      });
    }

    const result = await hubRoleService.getHubRoleById(hubId, roleId as string);

    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHubRole = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    const roleId = req.params.id;

    if (!hubId) {
      return res.status(401).json({
        success: false,
        message: 'Hub not authenticated',
      });
    }

    const result = await hubRoleService.updateHubRole(hubId, roleId as string, req.body);

    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteHubRole = async (req: Request, res: Response) => {
  try {
    const hubId = req.user?.id;
    const roleId = req.params.id;

    if (!hubId) {
      return res.status(401).json({
        success: false,
        message: 'Hub not authenticated',
      });
    }

    const result = await hubRoleService.deleteHubRole(hubId, roleId as string);

    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
