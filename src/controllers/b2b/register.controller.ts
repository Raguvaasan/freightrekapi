import { Request, Response } from 'express';
import { b2bAuthService } from '../../services/b2b/auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const registerB2b = async (req: Request, res: Response) => {
  const result = await b2bAuthService.register(req.body);
  return res.status(result.success ? 201 : 400).json(result);
};

export const getB2bProfile = async (req: AuthRequest, res: Response) => res.json(await b2bAuthService.getById(String(req.user!.id)));
export const updateB2bProfile = async (req: AuthRequest, res: Response) => res.json(await b2bAuthService.update(String(req.user!.id), req.body));
export const getB2bUser = async (req: Request, res: Response) => res.json(await b2bAuthService.getById(String(req.params.id)));
export const updateB2bUser = async (req: Request, res: Response) => res.json(await b2bAuthService.update(String(req.params.id), req.body));
export const listB2bUsers = async (req: Request, res: Response) => res.json(await b2bAuthService.list(req.query));
