import { Response } from 'express';
import { parcelSettlementService } from '../../services/admin/parcelSettlement.service';
import { parcelOrderService } from '../../services/admin/parcelOrder.service';
import { resolveParcelActor, ParcelActor } from '../../utils/parcelActor';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';

type AuthRequest = ParcelActorRequest;

const getActor = async (
  req: AuthRequest,
  res: Response
): Promise<ParcelActor | null> => {
  if (req.parcelActor) return req.parcelActor;

  const actor = await resolveParcelActor(req.user?.id);
  if (!actor) {
    res.status(403).json({
      success: false,
      message: 'Account is not allowed to access the settlement flow (or is inactive)',
    });
    return null;
  }
  return actor;
};

const fail = (res: Response, result: any, fallback = 400) =>
  res.status(result.code || fallback).json({
    success: false,
    message: result.message,
    ...(result.data ? { data: result.data } : {}),
  });

const filters = (req: AuthRequest) => ({
  page: parseInt(req.query.page as string) || 1,
  limit: parseInt(req.query.limit as string) || 10,
  agency: (req.query.agency || req.query.branch) as string,
  status: req.query.status as string,
  orderNumber: req.query.orderNumber as string,
  dateFrom: req.query.dateFrom as string,
  dateTo: req.query.dateTo as string,
});

/**
 * A branch may only see its own settlements; admin sees everything.
 */
const scopeFor = (actor: ParcelActor) =>
  actor.role === 'agency' ? { agencyId: actor.agencyId } : {};

export const getAllSettlements = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelSettlementService.getAllSettlements(
      filters(req),
      scopeFor(actor)
    );

    if (!result.success) return fail(res, result);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getSettlementById = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelSettlementService.getSettlementById(
      req.params.id as string,
      scopeFor(actor)
    );

    if (!result.success) return fail(res, result, 404);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getSettlementSummary = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    // An agency's summary is always its own, whatever the query says
    const query = filters(req);
    if (actor.role === 'agency') query.agency = actor.agencyId as string;

    const result = await parcelSettlementService.getSummary(query);

    if (!result.success) return fail(res, result);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Settle an order that has no active settlement (or re-settle a reversed one) */
export const settleParcelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    if (actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can settle a parcel order manually',
      });
    }

    const result = await parcelSettlementService.settleOrderById(
      req.params.orderId as string,
      actor
    );

    if (!result.success) return fail(res, result);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Refund the booked amount back to the branch (cancelled booking) */
export const reverseSettlement = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    if (actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can reverse a settlement',
      });
    }

    const result = await parcelSettlementService.reverseSettlementById(
      req.params.id as string,
      actor,
      req.body?.reason
    );

    if (!result.success) return fail(res, result);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateSettlementNotes = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    if (actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can edit settlement notes',
      });
    }

    const result = await parcelSettlementService.updateSettlementNotes(
      req.params.id as string,
      req.body.notes
    );

    if (!result.success) return fail(res, result, 404);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * What a booking of this amount would cost the branch, before booking it.
 * Query: ?amount=200 (&branch=<id> for admin).
 */
export const previewSettlement = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const amount = parseFloat(req.query.amount as string);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid amount query parameter is required',
      });
    }

    const result = await parcelOrderService.previewSettlement(
      amount,
      actor,
      (req.query.agency || req.query.branch) as string
    );

    if (!result.success) return fail(res, result);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
