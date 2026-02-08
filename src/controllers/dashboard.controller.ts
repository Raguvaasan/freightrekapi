import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

/**
 * Get franchise dashboard data
 */
export const getFranchiseDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await dashboardService.getFranchiseDashboard(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch dashboard data',
    });
  }
};
