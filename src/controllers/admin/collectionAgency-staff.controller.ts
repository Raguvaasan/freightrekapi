import { Request, Response } from 'express';
import { staffService } from '../../services/admin/staff.service';

// Get all staff for the logged-in collection agency
export const getCollectionAgencyStaff = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id; // Collection agency user's ID from JWT token

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency authentication required',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const roleId = req.query.roleId as string;

    // Force collectionAgencyId to be the logged-in collection agency
    const result = await staffService.getAllStaff(
      page,
      limit,
      search,
      status,
      undefined,
      roleId,
      'collection_agency',
      collectionAgencyId
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

// Get staff by ID (only if belongs to collection agency)
export const getCollectionAgencyStaffById = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const { id } = req.params;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency authentication required',
      });
    }

    const result = await staffService.getStaffById(id as string);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    // Verify that the staff belongs to this collection agency
    const staffAgencyId = result.data.collectionAgencyId?._id
      ? result.data.collectionAgencyId._id.toString()
      : result.data.collectionAgencyId?.toString();

    if (staffAgencyId !== collectionAgencyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your collection agency',
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

// Create staff for the logged-in collection agency
export const createCollectionAgencyStaff = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency authentication required',
      });
    }

    // Override type & collectionAgencyId with the logged-in collection agency's context
    const staffData = {
      ...req.body,
      type: 'collection_agency',
      collectionAgencyId: collectionAgencyId,
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

// Update staff (only if belongs to collection agency)
export const updateCollectionAgencyStaff = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const { id } = req.params;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency authentication required',
      });
    }

    // First verify the staff belongs to this collection agency
    const staffResult = await staffService.getStaffById(id as string);
    if (!staffResult.success) {
      return res.status(404).json({
        success: false,
        message: staffResult.message,
      });
    }

    const staffAgencyId = staffResult.data.collectionAgencyId?._id
      ? staffResult.data.collectionAgencyId._id.toString()
      : staffResult.data.collectionAgencyId?.toString();

    if (staffAgencyId !== collectionAgencyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your collection agency',
      });
    }

    // Don't allow collection agency to change type or collectionAgencyId
    const updateData = { ...req.body };
    delete updateData.collectionAgencyId;
    delete updateData.type;

    const result = await staffService.updateStaff(id as string, updateData);

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

// Update staff status (only if belongs to collection agency)
export const updateCollectionAgencyStaffStatus = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency authentication required',
      });
    }

    // First verify the staff belongs to this collection agency
    const staffResult = await staffService.getStaffById(id as string);
    if (!staffResult.success) {
      return res.status(404).json({
        success: false,
        message: staffResult.message,
      });
    }

    const staffAgencyId = staffResult.data.collectionAgencyId?._id
      ? staffResult.data.collectionAgencyId._id.toString()
      : staffResult.data.collectionAgencyId?.toString();

    if (staffAgencyId !== collectionAgencyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your collection agency',
      });
    }

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

// Delete staff (only if belongs to collection agency)
export const deleteCollectionAgencyStaff = async (req: Request, res: Response) => {
  try {
    const collectionAgencyId = req.user?.id;
    const { id } = req.params;

    if (!collectionAgencyId) {
      return res.status(401).json({
        success: false,
        message: 'Collection agency authentication required',
      });
    }

    // First verify the staff belongs to this collection agency
    const staffResult = await staffService.getStaffById(id as string);
    if (!staffResult.success) {
      return res.status(404).json({
        success: false,
        message: staffResult.message,
      });
    }

    const staffAgencyId = staffResult.data.collectionAgencyId?._id
      ? staffResult.data.collectionAgencyId._id.toString()
      : staffResult.data.collectionAgencyId?.toString();

    if (staffAgencyId !== collectionAgencyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff does not belong to your collection agency',
      });
    }

    const result = await staffService.deleteStaff(id as string);

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
