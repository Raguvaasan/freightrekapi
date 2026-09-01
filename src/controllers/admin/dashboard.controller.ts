import { Request, Response } from 'express';
import {
  AdminDashboardService,
  DashboardPeriod,
} from '../../services/admin/dashboard.service';

const dashboardService = new AdminDashboardService();

const DASHBOARD_PERIODS: DashboardPeriod[] = ['today', 'week', 'month', 'year', 'all'];

/** Anything unrecognised falls back to all time rather than 400-ing a dashboard */
const dashboardPeriod = (value: unknown): DashboardPeriod =>
  DASHBOARD_PERIODS.includes(value as DashboardPeriod) ? (value as DashboardPeriod) : 'all';

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getAdminDashboard(
      dashboardPeriod(req.query.period)
    );

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

export const getTopAgencies = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await dashboardService.getTopAgencies(
      limit,
      dashboardPeriod(req.query.period)
    );

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
      message: err.message || 'Error fetching top agencies',
    });
  }
};

/** The pre-parcel courier dashboard, kept on its own path */
export const getShipmentDashboard = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'week';

    const result = await dashboardService.getShipmentDashboard(period);

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
      message: err.message || 'Error fetching shipment dashboard',
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
    const isPreviousPeriod = req.query.type === 'previous' || req.query.isPrevious === 'true';
    const result = await dashboardService.getFranchiseReport(period, isPreviousPeriod);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error fetching franchise report' });
  }
};

// total revenue report for admin reports page
export const getTotalRevenueReport = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'thisMonth';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await dashboardService.getTotalRevenueReport(period, startDate, endDate);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error fetching revenue report' });
  }
};

export const getDeliveryPerformanceReport = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'thisMonth';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await dashboardService.getDeliveryPerformance(period, startDate, endDate);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Error fetching delivery performance' });
  }
};
