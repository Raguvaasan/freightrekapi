import { Request, Response } from 'express';
import * as franchiseRoleService from '../../services/admin/franchiseRole.service';
import { resolveAgencyId } from '../../utils/parcelActor';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';

/**
 * The agency these roles belong to. A direct agency login is the agency; an
 * agency staff member has an id of their own, so the agency is read off their
 * record.
 */
const agencyOf = (req: ParcelActorRequest): Promise<string | null> =>
  req.parcelActor?.agencyId
    ? Promise.resolve(req.parcelActor.agencyId)
    : resolveAgencyId(req.user?.id);

/**
 * Create franchise role
 */
export const createFranchiseRole = async (req: ParcelActorRequest, res: Response) => {
  try {
    const franchiseId = await agencyOf(req);

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
export const getFranchiseRoles = async (req: ParcelActorRequest, res: Response) => {
  try {
    const franchiseId = await agencyOf(req);

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
export const getFranchiseRoleById = async (req: ParcelActorRequest, res: Response) => {
  try {
    const franchiseId = await agencyOf(req);
    const roleId = req.params.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.getFranchiseRoleById(franchiseId, roleId as string);
    
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
export const updateFranchiseRole = async (req: ParcelActorRequest, res: Response) => {
  try {
    const franchiseId = await agencyOf(req);
    const roleId = req.params.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.updateFranchiseRole(franchiseId, roleId as string, req.body);
    
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
export const deleteFranchiseRole = async (req: ParcelActorRequest, res: Response) => {
  try {
    const franchiseId = await agencyOf(req);
    const roleId = req.params.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise not authenticated',
      });
    }

    const result = await franchiseRoleService.deleteFranchiseRole(franchiseId, roleId as string);
    
    if (!result.success) {
      const status = result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
