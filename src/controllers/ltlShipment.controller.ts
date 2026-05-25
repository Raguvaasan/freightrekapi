import { Request, Response } from 'express';
import { ltlShipmentService } from '../services/ltlShipment.service';
import { AdminUser } from '../models/admin/adminUser.model';
import { Role } from '../models/admin/role.model';
import { Staff } from '../models/admin/staff.model';
import { HubModel } from '../models/hub/hub.model';

// Helper: Resolve user role
async function resolveUserAccess(userId: string): Promise<{ isAdmin: boolean; hubId?: string }> {
  const adminUser = await AdminUser.findById(userId);
  if (adminUser) {
    return { isAdmin: true };
  }

  const staff = await Staff.findById(userId).select('roleId hubId type');
  if (staff) {
    if (staff.roleId) {
      const role = await Role.findById(staff.roleId).select('isRoot').lean();
      if (role && role.isRoot === true) return { isAdmin: true };
    }
    if (staff.type === 'hub' && staff.hubId) {
      return { isAdmin: false, hubId: staff.hubId.toString() };
    }
    return { isAdmin: false };
  }

  const hub = await HubModel.findById(userId);
  if (hub) {
    return { isAdmin: false, hubId: hub._id.toString() };
  }

  return { isAdmin: false };
}

export const createLtlShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await ltlShipmentService.createShipment({
      userId,
      ...req.body,
      orderType: req.body.orderType || 'b2b',
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'LTL Shipment created successfully',
      data: result.data,
    });
  } catch (err: any) {
    console.error('Create LTL shipment error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create LTL shipment',
    });
  }
};

export const getLtlShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const { isAdmin, hubId } = await resolveUserAccess(userId);
    const result = await ltlShipmentService.getShipment(orderId, userId, isAdmin, hubId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch LTL shipment',
    });
  }
};

export const getLtlShipments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const { isAdmin, hubId } = await resolveUserAccess(userId);
    const result = await ltlShipmentService.getShipments(userId, page, limit, status, isAdmin, hubId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch LTL shipments',
    });
  }
};

export const updateLtlShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const { isAdmin, hubId } = await resolveUserAccess(userId);
    const result = await ltlShipmentService.updateShipment(orderId, userId, req.body, isAdmin, hubId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'LTL Shipment updated successfully',
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update LTL shipment',
    });
  }
};

export const deleteLtlShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const { isAdmin, hubId } = await resolveUserAccess(userId);
    const result = await ltlShipmentService.deleteShipment(orderId, userId, isAdmin, hubId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete LTL shipment',
    });
  }
};
