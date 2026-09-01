import { Request, Response } from 'express';
import { routeService } from '../../services/admin/route.service';

export const createRoute = async (req: Request, res: Response) => {
  try {
    const result = await routeService.createRoute(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const result = await routeService.getAllRoutes(page, limit, search, status);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getRouteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await routeService.getRouteById(String(id));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await routeService.updateRoute(id as string, req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateRouteStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await routeService.updateRouteStatus(id as string, status);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateRouteBranches = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { branches } = req.body;

    const result = await routeService.updateBranches(id as string, branches);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await routeService.deleteRoute(id as string);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
