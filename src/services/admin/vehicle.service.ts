import { Vehicle } from '../../models/admin/vehicle.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateVehicleInput {
  vehicleType: string;
  capacity: string;
  vehicleRegistrationNumber: string;
  rcNumber: string;
  insuranceNumber: string;
  status?: 'Active' | 'Inactive';
}

interface UpdateVehicleInput {
  vehicleType?: string;
  capacity?: string;
  vehicleRegistrationNumber?: string;
  rcNumber?: string;
  insuranceNumber?: string;
  status?: 'Active' | 'Inactive';
}

export class VehicleService {
  // Create new vehicle
  async createVehicle(data: CreateVehicleInput): Promise<ServiceResponse> {
    try {
      const regNo = data.vehicleRegistrationNumber.toUpperCase();

      const existingVehicle = await Vehicle.findOne({
        vehicleRegistrationNumber: regNo,
      });

      if (existingVehicle) {
        return {
          success: false,
          message: 'A vehicle with this registration number already exists',
        };
      }

      const vehicle = new Vehicle({
        vehicleType: data.vehicleType,
        capacity: data.capacity,
        vehicleRegistrationNumber: regNo,
        rcNumber: data.rcNumber,
        insuranceNumber: data.insuranceNumber,
        status: data.status || 'Active',
      });

      await vehicle.save();

      return {
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error creating vehicle',
      };
    }
  }

  // Get all vehicles with pagination and search
  async getAllVehicles(
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
          { vehicleType: { $regex: search, $options: 'i' } },
          { vehicleRegistrationNumber: { $regex: search, $options: 'i' } },
          { rcNumber: { $regex: search, $options: 'i' } },
          { insuranceNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = status;
      }

      const vehicles = await Vehicle.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Vehicle.countDocuments(query);

      return {
        success: true,
        data: {
          vehicles,
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
        message: error.message || 'Error fetching vehicles',
      };
    }
  }

  // Get vehicle by ID
  async getVehicleById(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid vehicle ID',
        };
      }

      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return {
          success: false,
          message: 'Vehicle not found',
        };
      }

      return {
        success: true,
        data: vehicle,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching vehicle',
      };
    }
  }

  // Update vehicle
  async updateVehicle(id: string, data: UpdateVehicleInput): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid vehicle ID',
        };
      }

      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return {
          success: false,
          message: 'Vehicle not found',
        };
      }

      // Check for duplicate registration number if being changed
      if (data.vehicleRegistrationNumber) {
        const regNo = data.vehicleRegistrationNumber.toUpperCase();
        if (regNo !== vehicle.vehicleRegistrationNumber) {
          const existingVehicle = await Vehicle.findOne({
            vehicleRegistrationNumber: regNo,
            _id: { $ne: id },
          });

          if (existingVehicle) {
            return {
              success: false,
              message: 'A vehicle with this registration number already exists',
            };
          }
        }
        data.vehicleRegistrationNumber = regNo;
      }

      Object.keys(data).forEach((key) => {
        if (data[key as keyof UpdateVehicleInput] !== undefined) {
          (vehicle as any)[key] = data[key as keyof UpdateVehicleInput];
        }
      });

      await vehicle.save();

      return {
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating vehicle',
      };
    }
  }

  // Update vehicle status
  async updateVehicleStatus(
    id: string,
    status: 'Active' | 'Inactive'
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid vehicle ID',
        };
      }

      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!vehicle) {
        return {
          success: false,
          message: 'Vehicle not found',
        };
      }

      return {
        success: true,
        message: 'Vehicle status updated successfully',
        data: vehicle,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating vehicle status',
      };
    }
  }

  // Delete vehicle
  async deleteVehicle(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid vehicle ID',
        };
      }

      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return {
          success: false,
          message: 'Vehicle not found',
        };
      }

      await Vehicle.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Vehicle deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting vehicle',
      };
    }
  }
}

export const vehicleService = new VehicleService();
