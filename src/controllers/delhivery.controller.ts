import { Request, Response } from "express";
import * as svc from "../services/delhivery.service";

const respond = async (res: Response, fn: Promise<any>) => {
  try {
    const result = await fn;
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const pincodeServiceability = (req: Request, res: Response) => respond(res, svc.checkPincodeServiceability(req.body));
export const fetchWaybill = (req: Request, res: Response) => respond(res, svc.fetchWaybill(req.body));
export const manifestShipment = (req: Request, res: Response) => respond(res, svc.manifestShipment(req.body));
export const updateShipment = (req: Request, res: Response) => respond(res, svc.updateShipment(req.body));
export const cancelShipment = (req: Request, res: Response) => respond(res, svc.cancelShipment(req.body));
export const updateEwaybill = (req: Request, res: Response) => respond(res, svc.updateEwaybill(req.body));
export const trackShipment = (req: Request, res: Response) => respond(res, svc.trackShipment(req.body));
export const calculateShippingCost = (req: Request, res: Response) => respond(res, svc.calculateShippingCost(req.body));
export const generateLabel = (req: Request, res: Response) => respond(res, svc.generateLabel(req.body));
export const createPickupRequest = (req: Request, res: Response) => respond(res, svc.createPickupRequest(req.body));
export const createWarehouse = (req: Request, res: Response) => respond(res, svc.createWarehouse(req.body));
export const updateWarehouse = (req: Request, res: Response) => respond(res, svc.updateWarehouse(req.body));
export const configureWebhook = (req: Request, res: Response) => respond(res, svc.configureWebhook(req.body));
export const downloadDocument = (req: Request, res: Response) => respond(res, svc.downloadDocument(req.body));
export const createRvpQc = (req: Request, res: Response) => respond(res, svc.createRvpQc(req.body));
export const ndrAction = (req: Request, res: Response) => respond(res, svc.ndrAction(req.body));
