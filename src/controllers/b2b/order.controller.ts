import { Request, Response } from 'express';
import { b2bOrderService } from '../../services/b2b/order.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const createB2bOrderDraft = async (req: AuthRequest, res: Response) => {
  const result = await b2bOrderService.createDraft(String(req.user!.id), req.body);
  return res.status(result.success ? 201 : 400).json(result);
};
export const getB2bDrivers = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.getDriverOptions(req.query));
export const getB2bVehicles = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.getVehicleOptions(req.query));
export const getAdminB2bVehicles = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.getAdminVehicleOptions(req.query));
export const getB2bDraftStep2Details = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await b2bOrderService.getDraftStep2Details(String(req.params.id), String(req.user!.id)));
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to calculate B2B order quote' });
  }
};
export const confirmB2bOrder = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await b2bOrderService.confirm(String(req.params.id), String(req.user!.id)));
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to confirm B2B order' });
  }
};
export const selectB2bOrderVehicle = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await b2bOrderService.assignVehicle(String(req.params.id), String(req.body.vehicleId || req.body.vehicle), String(req.user!.id)));
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to select B2B order vehicle' });
  }
};
export const assignB2bOrderDriver = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.assignDriver(String(req.params.id), String(req.user!.id), String(req.body.driver)));
export const assignAdminB2bOrderDriver = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.assignDriver(String(req.params.id), undefined, String(req.body.driver)));
export const assignAdminB2bOrderVehicle = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.assignAdminVehicle(String(req.params.id), String(req.body.vehicle)));
export const updateAdminB2bOrderStatus = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.updateStatus(String(req.params.id), String(req.body.status)));
export const getB2bOrder = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.getById(String(req.params.id), String(req.user?.id || '')));
export const listB2bOrders = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.list(req.user?.id, req.query));
export const listAdminB2bOrders = async (req: Request, res: Response) => res.json(await b2bOrderService.list(undefined, req.query));
export const getAdminB2bOrder = async (req: Request, res: Response) => res.json(await b2bOrderService.getById(String(req.params.id)));
