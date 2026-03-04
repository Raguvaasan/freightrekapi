import { Request, Response } from 'express';
import { AdminDashboardService } from '../../services/admin/dashboard.service';

const dashboardService = new AdminDashboardService();

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'week';
    
    const result = await dashboardService.getAdminDashboard(period);
    
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
      message: err.message || 'Error fetching admin dashboard',
    });
  }
};

export const getTopFranchises = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const period = (req.query.period as 'day' | 'week' | 'month' | 'all') || 'all';
    
    const result = await dashboardService.getTopFranchises(limit, period);
    
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
      message: err.message || 'Error fetching top franchises',
    });
  }
};

export const getWalletStatistics = async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getWalletStatistics();
    
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
      message: err.message || 'Error fetching wallet statistics',
    });
  }
};

export const getOrdersStatistics = async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getOrdersStatistics();
    
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
      message: err.message || 'Error fetching orders statistics',
    });
  }
};

export const getFranchiseReport = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
    const result = await dashboardService.getFranchiseReport(period);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error fetching franchise report' });
  }
};
