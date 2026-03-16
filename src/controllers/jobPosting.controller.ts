import { Request, Response } from 'express';
import { jobPostingService } from '../services/jobPosting.service';

// Get all job postings
export const getAllJobPostings = async (req: Request, res: Response) => {
  try {
    const result = await jobPostingService.getAllJobPostings();

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

// Get job posting by ID
export const getJobPostingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Job posting ID is required'
      });
    }

    const result = await jobPostingService.getJobPostingById(id as string);

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

// Create new job posting (admin only)
export const createJobPosting = async (req: Request, res: Response) => {
  try {
    const result = await jobPostingService.createJobPosting(req.body);

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

// Update job posting (admin only)
export const updateJobPosting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Job posting ID is required'
      });
    }

    const result = await jobPostingService.updateJobPosting(id as string, req.body );

    if (!result.success) {
      return res.status(400).json({
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

// Delete job posting (admin only)
export const deleteJobPosting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Job posting ID is required'
      });
    }

    const result = await jobPostingService.deleteJobPosting(id as string);

    if (!result.success) {
      return res.status(400).json({
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
