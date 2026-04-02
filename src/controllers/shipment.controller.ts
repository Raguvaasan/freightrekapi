import { Request, Response } from 'express';
import { shipmentService } from '../services/shipment.service';
import { AdminUser } from '../models/admin/adminUser.model';
import { Agency } from '../models/admin/agency.model';
import { Staff } from '../models/admin/staff.model';
import { HubModel } from '../models/hub/hub.model';
import { AppCustomer } from '../models/customer/appCustomer.model';

export const createShipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await shipmentService.createShipment({
      userId,
      ...req.body,
      orderType: 'customer',
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

    // Check if user is admin
    let isAdmin = false;
    const user = await AdminUser.findById(userId).populate('roleId');
    if (user && user.roleId) {
      const role: any = user.roleId;
      isAdmin = role.isRoot === true;
    }

    const result = await shipmentService.getShipment(orderId as string, userId, isAdmin);

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

    // Check if user is admin
    let isAdmin = false;
    let franchiseUserIds: string[] = [];
    let hubId: string | undefined;
    
    const user = await AdminUser.findById(userId).populate('roleId');
    if (user && user.roleId) {
      const role: any = user.roleId;
      isAdmin = role.isRoot === true;
      
      // If admin, get all franchise (Agency), hub AND app customer user IDs
      if (isAdmin) {
        const agencies = await Agency.find({}, '_id');
        const hubs = await HubModel.find({}, '_id');
        const customers = await AppCustomer.find({}, '_id');
        franchiseUserIds = [
          ...agencies.map(agency => agency._id.toString()),
          ...hubs.map(hub => hub._id.toString()),
          ...customers.map(c => c._id.toString()),
        ];
      }
    }

    // Check if user is hub staff
    if (!isAdmin) {
      const staff = await Staff.findById(userId).select('hubId type');
      if (staff && staff.type === 'hub' && staff.hubId) {
        hubId = staff.hubId.toString();
      } else {
        // Check if user is hub directly
        const hub = await HubModel.findById(userId);
        if (hub) {
          hubId = hub._id.toString();
        }
      }
    }

    const result = await shipmentService.getShipments(userId, page, limit, status, isAdmin, franchiseUserIds, hubId);

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

    // Check if user is admin
    let isAdmin = false;
    const user = await AdminUser.findById(userId).populate('roleId');
    if (user && user.roleId) {
      const role: any = user.roleId;
      isAdmin = role.isRoot === true;
    }

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

    // Check if user is admin
    let isAdmin = false;
    const user = await AdminUser.findById(userId).populate('roleId');
    if (user && user.roleId) {
      const role: any = user.roleId;
      isAdmin = role.isRoot === true;
    }

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

    // Check if user is admin
    let isAdmin = false;
    const user = await AdminUser.findById(userId).populate('roleId');
    if (user && user.roleId) {
      const role: any = user.roleId;
      isAdmin = role.isRoot === true;
    }

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
