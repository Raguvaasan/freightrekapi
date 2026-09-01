import { Response } from 'express';
import { agencyPayoutService } from '../../services/admin/agencyPayout.service';
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
      message: 'Account is not allowed to access agency payouts (or is inactive)',
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
  search: req.query.search as string,
  status: req.query.status as string,
  dateFrom: (req.query.dateFrom || req.query.date) as string,
  dateTo: (req.query.dateTo || req.query.date) as string,
});

/** Every agency with what it has earned and what is still owed */
export const getAllAgencyPayouts = async (req: AuthRequest, res: Response) => {
  try {
    const result = await agencyPayoutService.getAllAgencyPayouts(filters(req));
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** One agency's payout page: the four totals plus the order history */
export const getAgencyPayout = async (req: AuthRequest, res: Response) => {
  try {
    const result = await agencyPayoutService.getAgencyPayout(
      req.params.agencyId as string,
      filters(req)
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

/** The "Pay" button: record a commission payment to the agency */
export const recordAgencyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await agencyPayoutService.recordPayment(
      req.params.agencyId as string,
      req.body,
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

export const getAgencyPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const result = await agencyPayoutService.getPaymentHistory(
      req.params.agencyId as string,
      filters(req)
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

export const reverseAgencyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await agencyPayoutService.reversePayment(
      req.params.paymentId as string,
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

// ---------------------------------------------------------------- agency self
// The same payout figures, read-only, for the agency that earned them. The
// agency id is never read from the request — it comes from the token, so one
// agency can never ask for another's commission.

const myAgencyId = (req: AuthRequest, res: Response): string | null => {
  const agencyId = req.parcelActor?.agencyId;
  if (!agencyId) {
    res.status(403).json({
      success: false,
      message: 'This login is not linked to an agency',
    });
    return null;
  }
  return agencyId;
};

/** This agency's payout details: the four totals plus its order history */
export const getMyAgencyPayout = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = myAgencyId(req, res);
    if (!agencyId) return;

    const result = await agencyPayoutService.getAgencyPayout(agencyId, filters(req));
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Commission payments this agency has received */
export const getMyAgencyPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = myAgencyId(req, res);
    if (!agencyId) return;

    const result = await agencyPayoutService.getPaymentHistory(agencyId, filters(req));
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
