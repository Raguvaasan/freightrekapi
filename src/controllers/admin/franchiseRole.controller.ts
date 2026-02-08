import { Request, Response } from 'express';
import * as franchiseRoleService from '../../services/admin/franchiseRole.service';

/**
 * Create franchise role
 */
export const createFranchiseRole = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.createFranchiseRole(franchiseId, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all franchise roles
 */
export const getFranchiseRoles = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.getFranchiseRoles(franchiseId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get franchise role by ID
 */
export const getFranchiseRoleById = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const roleId = req.params.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.getFranchiseRoleById(franchiseId, roleId);
    
    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update franchise role
 */
export const updateFranchiseRole = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const roleId = req.params.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.updateFranchiseRole(franchiseId, roleId, req.body);
    
    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete franchise role
 */
export const deleteFranchiseRole = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const roleId = req.params.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.deleteFranchiseRole(franchiseId, roleId);
    
    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
