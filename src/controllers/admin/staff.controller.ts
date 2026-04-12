import { Request, Response } from 'express';
import { staffService } from '../../services/admin/staff.service';

export const loginStaff = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await staffService.loginStaff(username, password);

    if (!result.success) {
      return res.status(401).json({
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

export const loginFranchiseStaff = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await staffService.loginFranchiseStaff(username, password);

    if (!result.success) {
      return res.status(401).json({
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

export const loginHeadQuarterStaff = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await staffService.loginHeadQuarterStaff(username, password);

    if (!result.success) {
      return res.status(401).json({
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

export const loginHubStaff = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await staffService.loginHubStaff(username, password);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const result = await staffService.createStaff(req.body);

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

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const franchiseId = req.query.franchiseId as string;
    const roleId = req.query.roleId as string;

    const result = await staffService.getAllStaff(
      page,
      limit,
      search,
      status,
      franchiseId,
      roleId
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

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await staffService.getStaffById(id as string);

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

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await staffService.updateStaff(id as string, req.body);

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

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await staffService.deleteStaff(id as string);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

export const updateStaffStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await staffService.updateStaffStatus(id as string, status);

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

export const loginCollectionExecutive = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await staffService.loginCollectionExecutive(username, password);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, data: result.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const sendStaffOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode, type } = req.body;
    const result = await staffService.sendLoginOtp(phone, countryCode, type);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const verifyStaffOtp = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode, otp, type } = req.body;
    const result = await staffService.verifyLoginOtp(phone, countryCode, otp, type);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
