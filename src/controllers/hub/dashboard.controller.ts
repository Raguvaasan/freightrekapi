import { Request, Response } from 'express';
import { hubDashboardService } from '../../services/hub/dashboard.service';
import { Staff } from '../../models/admin/staff.model';
import { HubModel } from '../../models/hub/hub.model';

// Helper: get hubId from authenticated user (hub direct or hub staff)
const getHubId = async (userId: string): Promise<string | null> => {
  const staff = await Staff.findById(userId).select('hubId type');
  if (staff && staff.type === 'hub' && staff.hubId) {
    return staff.hubId.toString();
  }
  const hub = await HubModel.findById(userId);
  if (hub) {
    return hub._id.toString();
  }
  return null;
};

// GET /hub/dashboard
export const getHubDashboard = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    const period = (req.query.period as string) || 'thisMonth';
    const validPeriods = ['week', 'thisMonth', 'lastMonth', 'month'];
    const selectedPeriod = validPeriods.includes(period) ? period as any : 'thisMonth';

    const result = await hubDashboardService.getDashboard(hubId, selectedPeriod);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
