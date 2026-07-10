import { Request, Response } from 'express';
import { collectionAgencyService } from '../../services/admin/collectionAgency.service';

export const sendCollectionAgencyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const result = await collectionAgencyService.sendLoginOtp(phone, countryCode);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const verifyCollectionAgencyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode, otp } = req.body;
    const result = await collectionAgencyService.verifyLoginOtp(phone, countryCode, otp);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const createCollectionAgency = async (req: Request, res: Response) => {
  try {
    const result = await collectionAgencyService.createCollectionAgency(req.body);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

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

export const getAllCollectionAgencies = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const result = await collectionAgencyService.getAllCollectionAgencies(
      page,
      limit,
      search,
      status
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getCollectionAgencyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await collectionAgencyService.getCollectionAgencyById(
      String(id)
    );

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateCollectionAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await collectionAgencyService.updateCollectionAgency(
      id as string,
      req.body
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

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

export const deleteCollectionAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await collectionAgencyService.deleteCollectionAgency(
      id as string
    );

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateCollectionAgencyStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await collectionAgencyService.updateCollectionAgencyStatus(
      id as string,
      status
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

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
