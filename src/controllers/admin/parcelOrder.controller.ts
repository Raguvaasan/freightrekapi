import { Response } from 'express';
import {
  parcelOrderService,
  ParcelListFilters,
  RegisterDirection,
} from '../../services/admin/parcelOrder.service';
import { ParcelStatus } from '../../models/admin/parcelOrder.model';
import { resolveParcelActor, ParcelActor } from '../../utils/parcelActor';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';

type AuthRequest = ParcelActorRequest;

/**
 * Every parcel endpoint is shared by admin, branch (franchise) and hub logins.
 * The acting party is derived from the token and the service scopes the data
 * accordingly, so one controller serves all three route groups.
 *
 * The branch/hub route groups resolve the actor in `requireParcelRole`, so it
 * is reused here when present; the admin routes resolve it on demand.
 */
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

export const createParcelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.createParcelOrder(req.body, actor);
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

const listFilters = (req: AuthRequest): ParcelListFilters => {
  const hubAssignment = req.query.hubAssignment as string;
  const direction = req.query.direction as string;

  return {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    search: req.query.search as string,
    status: req.query.status as string,
    // `branch` / `deliveryBranch` are the deprecated query names
    agency: (req.query.agency || req.query.branch) as string,
    deliveryAgency: (req.query.deliveryAgency || req.query.deliveryBranch) as string,
    counterpartAgency: (req.query.counterpartAgency ||
      req.query.counterpartBranch) as string,
    hub: req.query.hub as string,
    paymentType: req.query.paymentType as string,
    dateFrom: (req.query.dateFrom || req.query.date) as string,
    dateTo: (req.query.dateTo || req.query.date) as string,
    hubAssignment:
      hubAssignment === 'assigned' || hubAssignment === 'unassigned'
        ? hubAssignment
        : undefined,
    direction:
      direction === 'outgoing' || direction === 'incoming' ? direction : undefined,
  };
};

export const getAllParcelOrders = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.getAllParcelOrders(listFilters(req), actor);
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * Inward / outward register for one agency. A hub has no inward-outward of its
 * own — its movements are the hub queues.
 */
const register = (direction: RegisterDirection) =>
  async (req: AuthRequest, res: Response) => {
    try {
      const actor = await getActor(req, res);
      if (!actor) return;

      if (actor.role === 'hub') {
        return res.status(403).json({
          success: false,
          message: 'The inward/outward register is for agency and admin logins',
        });
      }

      const result = await parcelOrderService.getAgencyRegister(
        listFilters(req),
        actor,
        direction
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

/** Parcels booked at this agency and sent out */
export const getOutwardParcelOrders = register('outward');

/** Parcels booked elsewhere and addressed to this agency for delivery */
export const getInwardParcelOrders = register('inward');

export const getParcelOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.getParcelOrderById(
      String(req.params.id),
      actor
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

export const updateParcelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.updateParcelOrder(
      req.params.id as string,
      req.body,
      actor
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

// Admin assigns the processing hub for a branch booking
export const assignHub = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const { hub, note } = req.body;

    const result = await parcelOrderService.assignHub(
      req.params.id as string,
      hub,
      actor,
      note
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

// Hub (or admin) assigns the vehicle + driver that will carry the parcel
export const assignVehicleAndDriver = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const { vehicle, driver, note } = req.body;

    const result = await parcelOrderService.assignVehicleAndDriver(
      req.params.id as string,
      { vehicle, driver, note },
      actor
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

// Dropdown: available delivery branches (active franchises)
export const getDeliveryAgencyOptions = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.getDeliveryAgencyOptions(
      req.query.search as string
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

// Dropdown: assignable vehicles
export const getVehicleOptions = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.getVehicleOptions(
      req.query.search as string
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

// Dropdown: assignable drivers
export const getDriverOptions = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.getDriverOptions(
      req.query.search as string
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

export const updateTransportationCharge = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const { transportationCharge, loadingCharge, miscellaneousCharge } = req.body;

    const result = await parcelOrderService.updateTransportationCharge(
      req.params.id as string,
      transportationCharge,
      actor,
      { loadingCharge, miscellaneousCharge }
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

export const updateParcelStatus = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const { status, note } = req.body;

    const result = await parcelOrderService.updateStatus(
      req.params.id as string,
      status as ParcelStatus,
      actor,
      note
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

export const getParcelTracking = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.getTracking(
      req.params.id as string,
      actor
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

export const deleteParcelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await parcelOrderService.deleteParcelOrder(
      req.params.id as string,
      actor
    );
    if (!result.success) return fail(res, result, 404);

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};
