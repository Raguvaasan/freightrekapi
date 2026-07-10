import { Request, Response } from 'express';
import { shipmentService } from '../../services/shipment.service';
import { Staff } from '../../models/admin/staff.model';
import { CollectionAgency } from '../../models/admin/collectionAgency.model';

// Helper: resolve the collection agency id from the authenticated user
// (collection agency direct login OR collection agency staff login)
const getCollectionAgencyId = async (userId: string): Promise<string | null> => {
  // First check if it's a collection agency staff
  const staff = await Staff.findById(userId).select('collectionAgencyId type');
  if (staff && staff.type === 'collection_agency' && staff.collectionAgencyId) {
    return staff.collectionAgencyId.toString();
  }
  // Then check if it's a collection agency directly
  const agency = await CollectionAgency.findById(userId);
  if (agency) {
    return (agency._id as any).toString();
  }
  return null;
};

// POST /admin/collection-agency/orders/create
export const createCollectionAgencyOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const collectionAgencyId = await getCollectionAgencyId(staffId);
    if (!collectionAgencyId) return res.status(403).json({ success: false, message: 'Collection agency access required' });

    // Validate assignedStaffId belongs to the same collection agency
    if (req.body.assignedStaffId) {
      const assignedStaff = await Staff.findById(req.body.assignedStaffId).select('collectionAgencyId type');
      if (!assignedStaff || assignedStaff.type !== 'collection_agency' || !assignedStaff.collectionAgencyId || assignedStaff.collectionAgencyId.toString() !== collectionAgencyId) {
        return res.status(400).json({ success: false, message: 'Assigned staff must belong to the same collection agency' });
      }
    }

    const result = await shipmentService.createShipment({ userId: collectionAgencyId, ...req.body, skipWalletCheck: true });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message, data: result.data });
    }

    return res.status(201).json({ success: true, message: 'Order created successfully', data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /admin/collection-agency/orders
export const getCollectionAgencyOrders = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const collectionAgencyId = await getCollectionAgencyId(staffId);
    if (!collectionAgencyId) return res.status(403).json({ success: false, message: 'Collection agency access required' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const result = await shipmentService.getShipments(collectionAgencyId, page, limit, status, false);

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /admin/collection-agency/orders/:orderId
export const getCollectionAgencyOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const collectionAgencyId = await getCollectionAgencyId(staffId);
    if (!collectionAgencyId) return res.status(403).json({ success: false, message: 'Collection agency access required' });

    const { orderId } = req.params;
    const result = await shipmentService.getShipment(orderId as string, collectionAgencyId, false);

    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// PUT /admin/collection-agency/orders/:orderId
export const updateCollectionAgencyOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const collectionAgencyId = await getCollectionAgencyId(staffId);
    if (!collectionAgencyId) return res.status(403).json({ success: false, message: 'Collection agency access required' });

    const { orderId } = req.params;

    // Verify order belongs to this collection agency
    const existing = await shipmentService.getShipment(orderId as string, collectionAgencyId, false);
    if (!existing.success) return res.status(404).json(existing);

    const result = await shipmentService.updateShipment(orderId as string, collectionAgencyId, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// DELETE /admin/collection-agency/orders/:orderId
export const deleteCollectionAgencyOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const collectionAgencyId = await getCollectionAgencyId(staffId);
    if (!collectionAgencyId) return res.status(403).json({ success: false, message: 'Collection agency access required' });

    const { orderId } = req.params;
    const result = await shipmentService.deleteShipment(orderId as string, collectionAgencyId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /admin/collection-agency/orders/track/:waybill
export const trackCollectionAgencyOrder = async (req: Request, res: Response) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const collectionAgencyId = await getCollectionAgencyId(staffId);
    if (!collectionAgencyId) return res.status(403).json({ success: false, message: 'Collection agency access required' });

    const { waybill } = req.params;
    const result = await shipmentService.trackShipment(waybill as string, collectionAgencyId, false);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
