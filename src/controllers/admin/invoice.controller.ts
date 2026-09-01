import { Response } from 'express';
import { invoiceService, InvoiceScope } from '../../services/admin/invoice.service';
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
      message: 'Account is not allowed to access invoices (or is inactive)',
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

/**
 * An agency sees the invoices it raised plus those for parcels addressed to it
 * for delivery (the service widens the scope); a hub sees the invoices for the
 * parcels routed through it; admin sees everything.
 */
const scopeFor = (actor: ParcelActor): InvoiceScope => {
  if (actor.role === 'agency') return { agencyId: actor.agencyId };
  if (actor.role === 'hub') return { hubId: actor.hubId };
  return {};
};

const filters = (req: AuthRequest) => ({
  page: parseInt(req.query.page as string) || 1,
  limit: parseInt(req.query.limit as string) || 10,
  agency: (req.query.agency || req.query.branch) as string,
  status: req.query.status as string,
  invoiceNumber: req.query.invoiceNumber as string,
  // `orderId` is the name the frontend uses; `order` is accepted too
  order: (req.query.order || req.query.orderId) as string,
  orderNumber: req.query.orderNumber as string,
  paymentType: req.query.paymentType as string,
  search: req.query.search as string,
  dateFrom: (req.query.dateFrom || req.query.date) as string,
  dateTo: (req.query.dateTo || req.query.date) as string,
});

export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await invoiceService.getAllInvoices(filters(req), scopeFor(actor));
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await invoiceService.getInvoiceById(
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

export const getInvoiceByNumber = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await invoiceService.getInvoiceByNumber(
      req.params.invoiceNumber as string,
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

/** The invoice raised for a given parcel order */
export const getInvoiceByOrder = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await invoiceService.getInvoiceByOrder(
      req.params.orderId as string,
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

export const getInvoiceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const query = filters(req);
    // An agency's summary is always its own, whatever the query says
    if (actor.role === 'agency') query.agency = actor.agencyId as string;

    const result = await invoiceService.getSummary(query, scopeFor(actor));
    if (!result.success) return fail(res, result);

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** Raise an invoice for an order that has none (or re-issue a cancelled one) */
export const generateInvoiceForOrder = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    // A hub never bills; admin can raise one for any order and an agency only
    // for an order it booked (scopeFor pins it to its own agency id).
    if (actor.role === 'hub') {
      return res.status(403).json({
        success: false,
        message: 'A hub cannot raise invoices',
      });
    }

    const result = await invoiceService.createForOrderId(
      req.params.orderId as string,
      actor,
      scopeFor(actor)
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

export const updateInvoiceNotes = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    if (actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can edit invoice notes',
      });
    }

    const result = await invoiceService.updateInvoiceNotes(
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

export const cancelInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    if (actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can cancel an invoice',
      });
    }

    const result = await invoiceService.cancelById(
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
