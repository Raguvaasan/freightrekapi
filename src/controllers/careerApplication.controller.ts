import { Request, Response } from 'express';
import { careerApplicationService } from '../services/careerApplication.service';

// Get all applications with filters
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const filters = {
      jobPostingId: req.query.jobPostingId as string,
      status: req.query.status as string,
      email: req.query.email as string
    };

    const result = await careerApplicationService.getAllApplications(filters, page, limit);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get application by ID
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    const result = await careerApplicationService.getApplicationById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create new application
export const createApplication = async (req: Request, res: Response) => {
  try {
    const result = await careerApplicationService.createApplication(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update application status or details
export const updateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Only admin can update status
    if (req.body.status && typeof req.user === 'undefined') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update application status'
      });
    }

    const result = await careerApplicationService.updateApplication(id, req.body);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete application
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    const result = await careerApplicationService.deleteApplication(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get applications by job posting
export const getApplicationsByJobPosting = async (req: Request, res: Response) => {
  try {
    const { jobPostingId } = req.params;

    if (!jobPostingId) {
      return res.status(400).json({
        success: false,
        message: 'Job posting ID is required'
      });
    }

    const result = await careerApplicationService.getApplicationsByJobPosting(jobPostingId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
