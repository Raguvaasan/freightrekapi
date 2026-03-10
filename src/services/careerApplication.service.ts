import { CareerApplication } from '../models/careers/careerApplication.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const careerApplicationService = {
  // Get all applications (with optional filters)
  getAllApplications: async (
    filters?: {
      jobPostingId?: string;
      status?: string;
      email?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceResponse> => {
    try {
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filterObj: any = {};
      
      if (filters?.jobPostingId) {
        if (!Types.ObjectId.isValid(filters.jobPostingId)) {
          return {
            success: false,
            message: 'Invalid job posting ID'
          };
        }
        filterObj.jobPostingId = new Types.ObjectId(filters.jobPostingId);
      }
      
      if (filters?.status) {
        filterObj.status = filters.status;
      }
      
      if (filters?.email) {
        filterObj.email = { $regex: filters.email, $options: 'i' };
      }

      const applications = await CareerApplication.find(filterObj)
        .populate('jobPostingId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await CareerApplication.countDocuments(filterObj);

      return {
        success: true,
        data: {
          applications,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Get application by ID
  getApplicationById: async (id: string): Promise<ServiceResponse> => {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid application ID'
        };
      }

      const application = await CareerApplication.findById(id).populate('jobPostingId');
      
      if (!application) {
        return {
          success: false,
          message: 'Application not found'
        };
      }

      return {
        success: true,
        data: application
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Create new application
  createApplication: async (applicationData: any): Promise<ServiceResponse> => {
    try {
      // Validate jobPostingId
      if (!Types.ObjectId.isValid(applicationData.jobPostingId)) {
        return {
          success: false,
          message: 'Invalid job posting ID'
        };
      }

      // Check if email already applied for this job
      const existingApplication = await CareerApplication.findOne({
        email: applicationData.email,
        jobPostingId: applicationData.jobPostingId
      });

      if (existingApplication) {
        return {
          success: false,
          message: 'You have already applied for this position'
        };
      }

      const application = new CareerApplication(applicationData);
      const savedApplication = await application.save();
      
      const populatedApplication = await CareerApplication.findById(savedApplication._id)
        .populate('jobPostingId', 'title');

      return {
        success: true,
        message: 'Application submitted successfully',
        data: populatedApplication
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Update application
  updateApplication: async (id: string, updateData: any): Promise<ServiceResponse> => {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid application ID'
        };
      }

      // Check if application exists
      const application = await CareerApplication.findById(id);
      if (!application) {
        return {
          success: false,
          message: 'Application not found'
        };
      }

      // Update the application
      const updatedApplication = await CareerApplication.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('jobPostingId', 'title');

      return {
        success: true,
        message: 'Application updated successfully',
        data: updatedApplication
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Delete application
  deleteApplication: async (id: string): Promise<ServiceResponse> => {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid application ID'
        };
      }

      // Check if application exists
      const application = await CareerApplication.findById(id);
      if (!application) {
        return {
          success: false,
          message: 'Application not found'
        };
      }

      // Delete the application
      await CareerApplication.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Application deleted successfully'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Get applications by job posting
  getApplicationsByJobPosting: async (jobPostingId: string): Promise<ServiceResponse> => {
    try {
      if (!Types.ObjectId.isValid(jobPostingId)) {
        return {
          success: false,
          message: 'Invalid job posting ID'
        };
      }

      const applications = await CareerApplication.find({ jobPostingId })
        .sort({ createdAt: -1 })
        .populate('jobPostingId', 'title');

      return {
        success: true,
        data: applications
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  }
};
