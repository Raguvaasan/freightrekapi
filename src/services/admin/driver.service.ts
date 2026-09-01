import { Driver } from '../../models/admin/driver.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateDriverInput {
  driverName: string;
  phoneNumber: string;
  licenseNumber: string;
  dateOfExpiry: Date;
  status?: 'Active' | 'Inactive';
}

interface UpdateDriverInput {
  driverName?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  dateOfExpiry?: Date;
  status?: 'Active' | 'Inactive';
}

export class DriverService {
  // Create new driver
  async createDriver(data: CreateDriverInput): Promise<ServiceResponse> {
    try {
      const licenseNo = data.licenseNumber.toUpperCase();

      const existingDriver = await Driver.findOne({
        licenseNumber: licenseNo,
      });

      if (existingDriver) {
        return {
          success: false,
          message: 'A driver with this license number already exists',
        };
      }

      const driver = new Driver({
        driverName: data.driverName,
        phoneNumber: data.phoneNumber,
        licenseNumber: licenseNo,
        dateOfExpiry: data.dateOfExpiry,
        status: data.status || 'Active',
      });

      await driver.save();

      return {
        success: true,
        message: 'Driver created successfully',
        data: driver,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error creating driver',
      };
    }
  }

  // Get all drivers with pagination and search
  async getAllDrivers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (search) {
        query.$or = [
          { driverName: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { licenseNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = status;
      }

      const drivers = await Driver.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Driver.countDocuments(query);

      return {
        success: true,
        data: {
          drivers,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching drivers',
      };
    }
  }

  // Get driver by ID
  async getDriverById(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid driver ID',
        };
      }

      const driver = await Driver.findById(id);

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      return {
        success: true,
        data: driver,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching driver',
      };
    }
  }

  // Update driver
  async updateDriver(id: string, data: UpdateDriverInput): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid driver ID',
        };
      }

      const driver = await Driver.findById(id);

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      // Check for duplicate license number if being changed
      if (data.licenseNumber) {
        const licenseNo = data.licenseNumber.toUpperCase();
        if (licenseNo !== driver.licenseNumber) {
          const existingDriver = await Driver.findOne({
            licenseNumber: licenseNo,
            _id: { $ne: id },
          });

          if (existingDriver) {
            return {
              success: false,
              message: 'A driver with this license number already exists',
            };
          }
        }
        data.licenseNumber = licenseNo;
      }

      Object.keys(data).forEach((key) => {
        if (data[key as keyof UpdateDriverInput] !== undefined) {
          (driver as any)[key] = data[key as keyof UpdateDriverInput];
        }
      });

      await driver.save();

      return {
        success: true,
        message: 'Driver updated successfully',
        data: driver,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating driver',
      };
    }
  }

  // Update driver status
  async updateDriverStatus(
    id: string,
    status: 'Active' | 'Inactive'
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid driver ID',
        };
      }

      const driver = await Driver.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      return {
        success: true,
        message: 'Driver status updated successfully',
        data: driver,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating driver status',
      };
    }
  }

  // Delete driver
  async deleteDriver(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid driver ID',
        };
      }

      const driver = await Driver.findById(id);

      if (!driver) {
        return {
          success: false,
          message: 'Driver not found',
        };
      }

      await Driver.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Driver deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting driver',
      };
    }
  }
}

export const driverService = new DriverService();
