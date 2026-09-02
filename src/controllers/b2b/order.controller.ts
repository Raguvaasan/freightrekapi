import { Request, Response } from 'express';
import { b2bOrderService } from '../../services/b2b/order.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const createB2bOrderDraft = async (req: AuthRequest, res: Response) => {
  const result = await b2bOrderService.createDraft(String(req.user!.id), req.body);
  return res.status(result.success ? 201 : 400).json(result);
};
export const getB2bDraftStep2Details = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.getDraftStep2Details(String(req.params.id), String(req.user!.id)));
export const confirmB2bOrder = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.confirm(String(req.params.id), String(req.user!.id)));
export const getB2bOrder = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.getById(String(req.params.id), String(req.user?.id || '')));
export const listB2bOrders = async (req: AuthRequest, res: Response) => res.json(await b2bOrderService.list(req.user?.id, req.query));
export const listAdminB2bOrders = async (req: Request, res: Response) => res.json(await b2bOrderService.list(undefined, req.query));
export const getAdminB2bOrder = async (req: Request, res: Response) => res.json(await b2bOrderService.getById(String(req.params.id)));
