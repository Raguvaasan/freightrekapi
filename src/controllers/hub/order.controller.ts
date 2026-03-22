import { Request, Response } from 'express';
import { shipmentService } from '../../services/shipment.service';
import { Staff } from '../../models/admin/staff.model';

// Helper: get hubId from the authenticated hub staff
const getHubId = async (staffId: string): Promise<string | null> => {
  const staff = await Staff.findById(staffId).select('hubId type');
  if (!staff || staff.type !== 'hub' || !staff.hubId) return null;
  return staff.hubId.toString();
};

// POST /hub/orders/create
export const createHubOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const hubId = await getHubId(staffId);
    if (!hubId) return res.status(403).json({ success: false, message: 'Hub staff access required' });

    const result = await shipmentService.createShipment({ userId: hubId, ...req.body });

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
    const result = await shipmentService.getShipment(orderId, hubId, false);

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
    const existing = await shipmentService.getShipment(orderId, hubId, false);
    if (!existing.success) return res.status(404).json(existing);

    const result = await shipmentService.updateShipment(orderId, hubId, req.body);
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
    const result = await shipmentService.deleteShipment(orderId, hubId);
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
    const result = await shipmentService.trackShipment(waybill, staffId, false);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
