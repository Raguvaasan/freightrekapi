import { Response } from 'express';
import { bookingCustomerService } from '../../services/admin/bookingCustomer.service';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';
import { resolveParcelActor, ParcelActor } from '../../utils/parcelActor';

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
      message: 'Account is not allowed to access customers (or is inactive)',
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

const filters = (req: AuthRequest) => ({
  page: parseInt(req.query.page as string) || 1,
  limit: parseInt(req.query.limit as string) || 10,
  search: req.query.search as string,
  agency: (req.query.agency || req.query.branch) as string,
  paymentType: req.query.paymentType as string,
  dateFrom: (req.query.dateFrom || req.query.date) as string,
  dateTo: (req.query.dateTo || req.query.date) as string,
  sortBy: req.query.sortBy as 'recent' | 'orders' | 'amount' | 'name',
});

/** Customer Management: every customer who has booked a parcel */
export const getAllBookingCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await bookingCustomerService.getAllBookingCustomers(
      filters(req),
      actor
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

/** One customer's details and every order they have placed */
export const getBookingCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await bookingCustomerService.getBookingCustomer(
      req.params.mobileNumber as string,
      filters(req),
      actor
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
