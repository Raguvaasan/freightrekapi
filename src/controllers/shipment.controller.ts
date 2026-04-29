import { Request, Response } from 'express';
import { shipmentService } from '../services/shipment.service';
import { AdminUser } from '../models/admin/adminUser.model';
import { Role } from '../models/admin/role.model';
import { Staff } from '../models/admin/staff.model';
import { HubModel } from '../models/hub/hub.model';

// Helper: Resolve user role - checks AdminUser first, then Staff with AdminRole
async function resolveUserAccess(userId: string): Promise<{ isAdmin: boolean; hubId?: string }> {
  // Check AdminUser collection — any admin user can manage all orders
  const adminUser = await AdminUser.findById(userId);
  if (adminUser) {
    return { isAdmin: true };
  }

  // Check Staff collection
  const staff = await Staff.findById(userId).select('roleId hubId type');
  if (staff) {
    // Check if staff has an admin role with isRoot
    if (staff.roleId) {
      const role = await Role.findById(staff.roleId).select('isRoot').lean();
      if (role && role.isRoot === true) return { isAdmin: true };
    }
    // Hub staff
    if (staff.type === 'hub' && staff.hubId) {
      return { isAdmin: false, hubId: staff.hubId.toString() };
    }
    // Head quarter staff without isRoot - treat as regular user
    return { isAdmin: false };
  }

  // Check if user is a Hub directly
  const hub = await HubModel.findById(userId);
  if (hub) {
    return { isAdmin: false, hubId: hub._id.toString() };
  }

  return { isAdmin: false };
}

export const createShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // If the user is a franchise staff, use franchiseId for wallet deduction
    let walletUserId: string | undefined;
    const staff = await Staff.findById(userId).select('type franchiseId');
    if (staff && staff.type === 'franchise' && staff.franchiseId) {
      walletUserId = staff.franchiseId.toString();
    }

    const result = await shipmentService.createShipment({
      userId,
      ...req.body,
      orderType: 'customer',
      walletUserId,
    });

    // Handle error responses (including insufficient wallet balance)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.message, // Added for clarity
      });
    }

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: result.data,
    });
  } catch (err: any) {
    console.error('Create shipment controller error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create shipment',
      error: err.message,
    });
  }
};

export const getShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const { isAdmin, hubId } = await resolveUserAccess(userId);

    const result = await shipmentService.getShipment(orderId as string, userId, isAdmin, hubId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch shipment',
    });
  }
};

export const getShipments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const { isAdmin, hubId } = await resolveUserAccess(userId);

    const result = await shipmentService.getShipments(userId, page, limit, status, isAdmin, [], hubId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch shipments',
    });
  }
};

export const trackShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { waybill } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: 'Waybill is required',
      });
    }

    const { isAdmin } = await resolveUserAccess(userId);

    const result = await shipmentService.trackShipment(waybill as string, userId, isAdmin);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to track shipment',
    });
  }
};

export const updateShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const { isAdmin } = await resolveUserAccess(userId);

    const result = await shipmentService.updateShipment(orderId as string, userId, updateData, isAdmin);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update shipment',
    });
  }
};

export const deleteShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const { isAdmin } = await resolveUserAccess(userId);

    const result = await shipmentService.deleteShipment(orderId as string, userId, isAdmin);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete shipment',
    });
  }
};

export const getActiveShipments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { isAdmin, hubId } = await resolveUserAccess(userId);

    // Active = not cancelled, not delivered
    const result = await shipmentService.getShipments(userId, page, limit, 'Active', isAdmin, [], hubId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch active shipments',
    });
  }
};
