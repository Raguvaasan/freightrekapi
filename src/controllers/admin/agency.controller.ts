import { Request, Response } from 'express';
import { agencyService } from '../../services/admin/agency.service';

export const loginFranchise = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await agencyService.loginFranchise(username, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
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

export const createAgency = async (req: Request, res: Response) => {
  try {
    const result = await agencyService.createAgency(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
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

export const getAllAgencies = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const result = await agencyService.getAllAgencies(
      page,
      limit,
      search,
      status,
      type
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const getAgencyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await agencyService.getAgencyById(String(id));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await agencyService.updateAgency(id as string, req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
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

export const deleteAgency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Optional - which agency the staff should move to. Left out, the service
    // picks the nearest active agency itself.
    const reassignAgencyId = (req.body?.reassignAgencyId || req.query.reassignAgencyId) as
      | string
      | undefined;
    const result = await agencyService.deleteAgency(id as string, reassignAgencyId);

    if (!result.success) {
      const status = result.message === 'Agency not found' ? 404 : 400;
      return res.status(status).json({
        success: false,
        message: result.message,
      });
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

export const getAgenciesByHub = async (req: Request, res: Response) => {
  try {
    const { hubId } = req.params;
    return res.status(410).json({
      success: false,
      message: 'Assigned hub field is removed',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateAgencyStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await agencyService.updateAgencyStatus(id as string, status);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
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

export const updateAgencyProfitPercentage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { profitPercentage } = req.body;

    const result = await agencyService.updateProfitPercentage(
      id as string,
      profitPercentage
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
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

export const sendFranchiseOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const result = await agencyService.sendLoginOtp(phone, countryCode);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const verifyFranchiseOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode, otp } = req.body;
    const result = await agencyService.verifyLoginOtp(phone, countryCode, otp);
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
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
