import { Response } from 'express';
import { branchWalletService } from '../../services/admin/branchWallet.service';
import { resolveParcelActor, ParcelActor } from '../../utils/parcelActor';
import { ParcelActorRequest } from '../../middleware/parcelActor.middleware';

type AuthRequest = ParcelActorRequest;

/**
 * Branch wallet endpoints.
 *
 * The admin route group manages every branch's wallet; the branch route group
 * exposes the same data read-only, scoped to the caller's own branch.
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
      message: 'Account is not allowed to access the wallet flow (or is inactive)',
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

const listFilters = (req: AuthRequest) => ({
  page: parseInt(req.query.page as string) || 1,
  limit: parseInt(req.query.limit as string) || 20,
  type: req.query.type as string,
  dateFrom: req.query.dateFrom as string,
  dateTo: req.query.dateTo as string,
});

// ---------------------------------------------------------------- admin side

export const getAllBranchWallets = async (req: AuthRequest, res: Response) => {
  try {
    const result = await branchWalletService.getAllBranchWallets({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      status: req.query.status as string,
    });

    if (!result.success) return fail(res, result);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getBranchWallet = async (req: AuthRequest, res: Response) => {
  try {
    const result = await branchWalletService.getBranchWallet(
      req.params.branchId as string,
      // Admin route: the charge percentages are reported here and nowhere else
      { includeChargePercentages: true }
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

/** Admin sets the commission / loading / miscellaneous percentages */
export const updateBranchPercentages = async (req: AuthRequest, res: Response) => {
  try {
    const { profitPercentage, loadingChargePercentage, miscChargePercentage } =
      req.body;

    const result = await branchWalletService.updatePercentages(
      req.params.branchId as string,
      { profitPercentage, loadingChargePercentage, miscChargePercentage }
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

export const creditBranchWallet = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const { amount, remarks, paymentMethod, reference } = req.body;

    const result = await branchWalletService.creditBranchWallet(
      req.params.branchId as string,
      { amount, remarks, paymentMethod, reference },
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

export const debitBranchWallet = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const { amount, remarks, paymentMethod, reference } = req.body;

    const result = await branchWalletService.debitBranchWallet(
      req.params.branchId as string,
      { amount, remarks, paymentMethod, reference },
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

export const getBranchWalletTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const result = await branchWalletService.getBranchTransactions(
      req.params.branchId as string,
      listFilters(req)
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

export const getWalletTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const result = await branchWalletService.getTransactionById(
      req.params.transactionId as string
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

export const updateWalletTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await branchWalletService.updateTransactionRemarks(
      req.params.transactionId as string,
      req.body.remarks,
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

export const reverseWalletTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor) return;

    const result = await branchWalletService.reverseTransaction(
      req.params.transactionId as string,
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

export const getAdminWallet = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await branchWalletService.getAdminWallet();
    if (!result.success) return fail(res, result);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getAdminWalletTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const result = await branchWalletService.getAdminTransactions(listFilters(req));
    if (!result.success) return fail(res, result);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// --------------------------------------------------------------- branch side

/** The logged-in branch's own wallet */
export const getMyBranchWallet = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await getActor(req, res);
    if (!actor?.agencyId) {
      return res.status(403).json({ success: false, message: 'Branch access required' });
    }

    const result = await branchWalletService.getBranchWallet(actor.agencyId);
    if (!result.success) return fail(res, result, 404);
    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/** The logged-in branch's own wallet statement */
export const getMyBranchWalletTransactions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const actor = await getActor(req, res);
    if (!actor?.agencyId) {
      return res.status(403).json({ success: false, message: 'Branch access required' });
    }

    const result = await branchWalletService.getBranchTransactions(
      actor.agencyId,
      listFilters(req)
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
