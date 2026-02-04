import { Request, Response } from 'express';
import { shipmentService } from '../services/shipment.service';

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
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create shipment',
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

    const result = await shipmentService.getShipment(orderId, userId);

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

    const result = await shipmentService.getShipments(userId, page, limit, status);

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

    const result = await shipmentService.trackShipment(waybill, userId);

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
