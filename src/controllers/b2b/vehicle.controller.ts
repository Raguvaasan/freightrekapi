import { Request, Response } from 'express';
import { b2bVehicleService } from '../../services/b2b/vehicle.service';

export const createB2bVehicle = async (req: Request, res: Response) => res.status(201).json(await b2bVehicleService.create(req.body));
export const listB2bVehicles = async (req: Request, res: Response) => res.json(await b2bVehicleService.list(req.query));
export const getB2bVehicle = async (req: Request, res: Response) => {
  const result = await b2bVehicleService.getById(String(req.params.id));
  return res.status(result.success ? 200 : 404).json(result);
};
export const updateB2bVehicle = async (req: Request, res: Response) => res.json(await b2bVehicleService.update(String(req.params.id), req.body));
export const deactivateB2bVehicle = async (req: Request, res: Response) => res.json(await b2bVehicleService.deactivate(String(req.params.id)));
export const deleteB2bVehicle = async (req: Request, res: Response) => res.json(await b2bVehicleService.delete(String(req.params.id)));
