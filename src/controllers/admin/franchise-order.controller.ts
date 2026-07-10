import { Request, Response } from 'express';
import { shipmentService } from '../../services/shipment.service';
import { Staff } from '../../models/admin/staff.model';
import { Agency } from '../../models/admin/agency.model';

// Helper: resolve the franchise (agency) id from the authenticated user
// (franchise direct login OR franchise staff login)
const getFranchiseId = async (userId: string): Promise<string | null> => {
  // First check if it's a franchise staff
  const staff = await Staff.findById(userId).select('franchiseId type');
  if (staff && staff.type === 'franchise' && staff.franchiseId) {
    return staff.franchiseId.toString();
  }
  // Then check if it's a franchise (agency) directly
  const agency = await Agency.findById(userId);
  if (agency) {
    return agency._id.toString();
  }
  return null;
};

// POST /admin/franchise/orders/create
export const createFranchiseOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const franchiseId = await getFranchiseId(staffId);
    if (!franchiseId) return res.status(403).json({ success: false, message: 'Franchise access required' });

    // Validate assignedStaffId belongs to the same franchise
    if (req.body.assignedStaffId) {
      const assignedStaff = await Staff.findById(req.body.assignedStaffId).select('franchiseId type');
      if (!assignedStaff || assignedStaff.type !== 'franchise' || !assignedStaff.franchiseId || assignedStaff.franchiseId.toString() !== franchiseId) {
        return res.status(400).json({ success: false, message: 'Assigned staff must belong to the same franchise' });
      }
    }

    const result = await shipmentService.createShipment({ userId: franchiseId, ...req.body });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message, data: result.data });
    }

    return res.status(201).json({ success: true, message: 'Order created successfully', data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /admin/franchise/orders
export const getFranchiseOrders = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const franchiseId = await getFranchiseId(staffId);
    if (!franchiseId) return res.status(403).json({ success: false, message: 'Franchise access required' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const result = await shipmentService.getShipments(franchiseId, page, limit, status, false);

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /admin/franchise/orders/:orderId
export const getFranchiseOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const franchiseId = await getFranchiseId(staffId);
    if (!franchiseId) return res.status(403).json({ success: false, message: 'Franchise access required' });

    const { orderId } = req.params;
    const result = await shipmentService.getShipment(orderId as string, franchiseId, false);

    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// PUT /admin/franchise/orders/:orderId
export const updateFranchiseOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const franchiseId = await getFranchiseId(staffId);
    if (!franchiseId) return res.status(403).json({ success: false, message: 'Franchise access required' });

    const { orderId } = req.params;

    // Verify order belongs to this franchise
    const existing = await shipmentService.getShipment(orderId as string, franchiseId, false);
    if (!existing.success) return res.status(404).json(existing);

    const result = await shipmentService.updateShipment(orderId as string, franchiseId, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// DELETE /admin/franchise/orders/:orderId
export const deleteFranchiseOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const franchiseId = await getFranchiseId(staffId);
    if (!franchiseId) return res.status(403).json({ success: false, message: 'Franchise access required' });

    const { orderId } = req.params;
    const result = await shipmentService.deleteShipment(orderId as string, franchiseId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /admin/franchise/orders/track/:waybill
export const trackFranchiseOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const franchiseId = await getFranchiseId(staffId);
    if (!franchiseId) return res.status(403).json({ success: false, message: 'Franchise access required' });

    const { waybill } = req.params;
    const result = await shipmentService.trackShipment(waybill as string, franchiseId, false);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
