import { Request, Response } from 'express';
import { shipmentService } from '../../services/shipment.service';
import { Staff } from '../../models/admin/staff.model';
import { HubModel } from '../../models/hub/hub.model';

// Helper: get hubId from authenticated user (hub direct or hub staff)
const getHubId = async (userId: string): Promise<string | null> => {
  // First check if it's a hub staff
  const staff = await Staff.findById(userId).select('hubId type');
  if (staff && staff.type === 'hub' && staff.hubId) {
    return staff.hubId.toString();
  }
  // Then check if it's a hub directly
  const hub = await HubModel.findById(userId);
  if (hub) {
    return hub._id.toString();
  }
  return null;
};

// POST /hub/orders/create
export const createHubOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    // Validate orderType
    const orderType = req.body.orderType || 'customer';

    // If hub type, pickupLocation and from address fields are mandatory
    if (orderType === 'hub') {
      if (!req.body.pickupLocation || !req.body.pickupLocation.name) {
        return res.status(400).json({ success: false, message: 'pickupLocation is required for hub order type' });
      }
      if (!req.body.fromName || !req.body.fromAdd || !req.body.fromPin || !req.body.fromCity || !req.body.fromState || !req.body.fromPhone) {
        return res.status(400).json({ success: false, message: 'From address fields (fromName, fromAdd, fromPin, fromCity, fromState, fromPhone) are required for hub order type' });
      }
    }

    // Validate assignedStaffId belongs to the same hub
    if (req.body.assignedStaffId) {
      const assignedStaff = await Staff.findById(req.body.assignedStaffId).select('hubId type');
      if (!assignedStaff || assignedStaff.type !== 'hub' || !assignedStaff.hubId || assignedStaff.hubId.toString() !== hubId) {
        return res.status(400).json({ success: false, message: 'Assigned staff must belong to the same hub' });
      }
    }

    // The creating hub owns this order so it appears in the hub's order list
    // (which filters by assignedHubId).
    const result = await shipmentService.createShipment({ userId: hubId, ...req.body, orderType, assignedHubId: hubId, skipWalletCheck: true });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(201).json({ success: true, message: 'Order created successfully', data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /hub/orders
export const getHubOrders = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const result = await shipmentService.getShipments(hubId, page, limit, status, false, undefined, hubId);

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /hub/orders/:orderId
export const getHubOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    const { orderId } = req.params;
    const result = await shipmentService.getShipment(orderId as string, hubId, false, hubId);

    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// PUT /hub/orders/:orderId
export const updateHubOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    const { orderId } = req.params;

    // Verify order belongs to this hub
    const existing = await shipmentService.getShipment(orderId as string, hubId, false);
    if (!existing.success) return res.status(404).json(existing);

    const result = await shipmentService.updateShipment(orderId as string, hubId, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// DELETE /hub/orders/:orderId
export const deleteHubOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    const { orderId } = req.params;
    const result = await shipmentService.deleteShipment(orderId as string, hubId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /hub/orders/track/:waybill
export const trackHubOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { waybill } = req.params;
    const result = await shipmentService.trackShipment(waybill as string, staffId, false);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
