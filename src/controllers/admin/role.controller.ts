import { Request, Response } from "express";
import * as roleService from '../../services/admin/role.service'

/**
 * Create role - For initial setup (no auth required)
 * Only works if no roles exist in database
 */
export const createRoleSetup = async (req: Request, res: Response) => {
  try {
    const existingRolesResult = await roleService.getRoles();
    if (!existingRolesResult.success) {
      return res.status(400).json(existingRolesResult);
    }

    const existingRoles = existingRolesResult.data || [];
    if (existingRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Setup already completed. Use authenticated endpoint to create more roles."
      });
    }

    const createResult = await roleService.createRole(req.body);
    if (!createResult.success) {
      return res.status(400).json(createResult);
    }

    res.status(201).json({ success: true, message: "Setup role created", data: createResult.data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const result = await roleService.createRole(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const getRoles = async (req: Request, res: Response) => {
  try {
    const result = await roleService.getRoles();
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRolesById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const result = await roleService.getRolesById(id);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const updateRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const rb = req.body
    const result = await roleService.updateRole(id, rb)
    if (!result.success) {
      const status = result.message === "Role not found" ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json({ success: true, data: result.data });
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const deleteRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const result = await roleService.deleteRole(id);

    if (!result.success) {
      const status = result.message === "Role not found" ? 404 : 400;
      return res.status(status).json(result);
    }

    res.status(200).json(result);
  }
  catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
