import { Request, Response } from 'express';
import { staffService } from '../../services/admin/staff.service';

// Get all staff for the logged-in franchise
export const getFranchiseStaff = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id; // Franchise user's ID from JWT token
    
    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise authentication required',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const roleId = req.query.roleId as string;

    // Force franchiseId to be the logged-in franchise
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

// Get staff by ID (only if belongs to franchise)
export const getFranchiseStaffById = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const { id } = req.params;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise authentication required',
      });
    }

    const result = await staffService.getStaffById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    // Verify that the staff belongs to this franchise
    if (result.data.franchiseId._id.toString() !== franchiseId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your franchise',
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

// Create staff for the logged-in franchise
export const createFranchiseStaff = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise authentication required',
      });
    }

    // Override franchiseId with the logged-in franchise's ID
    const staffData = {
      ...req.body,
      franchiseId: franchiseId,
    };

    const result = await staffService.createStaff(staffData);

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

// Update staff (only if belongs to franchise)
export const updateFranchiseStaff = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const { id } = req.params;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise authentication required',
      });
    }

    // First verify the staff belongs to this franchise
    const staffResult = await staffService.getStaffById(id);
    if (!staffResult.success) {
      return res.status(404).json({
        success: false,
        message: staffResult.message,
      });
    }

    if (staffResult.data.franchiseId._id.toString() !== franchiseId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your franchise',
      });
    }

    // Don't allow franchise to change franchiseId
    const updateData = { ...req.body };
    delete updateData.franchiseId;

    const result = await staffService.updateStaff(id, updateData);

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

// Update staff status (only if belongs to franchise)
export const updateFranchiseStaffStatus = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise authentication required',
      });
    }

    // First verify the staff belongs to this franchise
    const staffResult = await staffService.getStaffById(id);
    if (!staffResult.success) {
      return res.status(404).json({
        success: false,
        message: staffResult.message,
      });
    }

    if (staffResult.data.franchiseId._id.toString() !== franchiseId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your franchise',
      });
    }

    const result = await staffService.updateStaffStatus(id, status);

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

// Delete staff (only if belongs to franchise)
export const deleteFranchiseStaff = async (req: Request, res: Response) => {
  try {
    const franchiseId = req.user?.id;
    const { id } = req.params;

    if (!franchiseId) {
      return res.status(401).json({
        success: false,
        message: 'Franchise authentication required',
      });
    }

    // First verify the staff belongs to this franchise
    const staffResult = await staffService.getStaffById(id);
    if (!staffResult.success) {
      return res.status(404).json({
        success: false,
        message: staffResult.message,
      });
    }

    if (staffResult.data.franchiseId._id.toString() !== franchiseId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your franchise',
      });
    }

    const result = await staffService.deleteStaff(id);

    if (!result.success) {
      return res.status(400).json({
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
