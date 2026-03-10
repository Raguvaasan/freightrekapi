import { JobPosting } from '../models/careers/jobPosting.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const jobPostingService = {
  // Get all active job postings
  getAllJobPostings: async (): Promise<ServiceResponse> => {
    try {
      const jobPostings = await JobPosting.find({ isActive: true })
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: jobPostings
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Get job posting by ID
  getJobPostingById: async (id: string): Promise<ServiceResponse> => {
    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid job posting ID'
        };
      }

      const jobPosting = await JobPosting.findById(id);
      if (!jobPosting) {
        return {
          success: false,
          message: 'Job posting not found'
        };
      }

      return {
        success: true,
        data: jobPosting
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Create new job posting
  createJobPosting: async (jobPostingData: any): Promise<ServiceResponse> => {
    try {
      const jobPosting = new JobPosting(jobPostingData);
      const savedJobPosting = await jobPosting.save();

      return {
        success: true,
        message: 'Job posting created successfully',
        data: savedJobPosting
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Update job posting
  updateJobPosting: async (id: string, updateData: any): Promise<ServiceResponse> => {
    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid job posting ID'
        };
      }

      // Check if job posting exists
      const jobPosting = await JobPosting.findById(id);
      if (!jobPosting) {
        return {
          success: false,
          message: 'Job posting not found'
        };
      }

      // Update the job posting
      const updatedJobPosting = await JobPosting.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        message: 'Job posting updated successfully',
        data: updatedJobPosting
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Delete job posting (soft delete)
  deleteJobPosting: async (id: string): Promise<ServiceResponse> => {
    try {
      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid job posting ID'
        };
      }

      // Check if job posting exists
      const jobPosting = await JobPosting.findById(id);
      if (!jobPosting) {
        return {
          success: false,
          message: 'Job posting not found'
        };
      }

      // Soft delete by setting isActive to false
      const deletedJobPosting = await JobPosting.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      return {
        success: true,
        message: 'Job posting deleted successfully',
        data: deletedJobPosting
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  }
};
