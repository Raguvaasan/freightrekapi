import { Response } from 'express';
import { parcelDashboardService } from '../../services/admin/parcelDashboard.service';
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
      message: 'Account is not allowed to access the parcel flow (or is inactive)',
    });
    return null;
  }
  return actor;
};

const fail = (res: Response, result: any, fallback = 400) =>
  res.status(result.code || fallback).json({
    success: false,
    message: result.message,
  });

/**
 * An agency's own dashboard. Always scoped to the logged-in agency, so no
 * agency id is accepted — an admin comparing agencies uses /admin/dashboard.
 */
export const getAgencyDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelDashboardService.getAgencyDashboard(actor.agencyId);
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** A hub's own dashboard, scoped to the logged-in hub */
export const getHubParcelDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelDashboardService.getHubDashboard(actor.hubId);
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
