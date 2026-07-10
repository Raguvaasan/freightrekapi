import { Request, Response } from 'express';
import * as collectionAgencyRoleService from '../../services/admin/collectionAgencyRole.service';

/**
 * Create collection agency role
 */
export const createCollectionAgencyRole = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency not authenticated',
      });
    }

    const result = await collectionAgencyRoleService.createCollectionAgencyRole(collectionAgencyId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all collection agency roles
 */
export const getCollectionAgencyRoles = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency not authenticated',
      });
    }

    const result = await collectionAgencyRoleService.getCollectionAgencyRoles(collectionAgencyId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get collection agency role by ID
 */
export const getCollectionAgencyRoleById = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const roleId = req.params.id;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency not authenticated',
      });
    }

    const result = await collectionAgencyRoleService.getCollectionAgencyRoleById(collectionAgencyId, roleId as string);

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
 * Update collection agency role
 */
export const updateCollectionAgencyRole = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const roleId = req.params.id;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency not authenticated',
      });
    }

    const result = await collectionAgencyRoleService.updateCollectionAgencyRole(collectionAgencyId, roleId as string, req.body);

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
 * Delete collection agency role
 */
export const deleteCollectionAgencyRole = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const roleId = req.params.id;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency not authenticated',
      });
    }

    const result = await collectionAgencyRoleService.deleteCollectionAgencyRole(collectionAgencyId, roleId as string);

    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
