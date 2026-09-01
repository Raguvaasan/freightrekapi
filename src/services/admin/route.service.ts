import { Route } from '../../models/admin/route.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateRouteInput {
  routeName: string;
  from: string;
  to: string;
  branches?: string[];
  transportationCharge?: number;
  status?: 'Active' | 'Inactive';
}

interface UpdateRouteInput {
  routeName?: string;
  from?: string;
  to?: string;
  branches?: string[];
  transportationCharge?: number;
  status?: 'Active' | 'Inactive';
}

export class RouteService {
  // Create new route
  async createRoute(data: CreateRouteInput): Promise<ServiceResponse> {
    try {
      // Check if a route with the same origin/destination already exists
      const existingRoute = await Route.findOne({
        from: data.from,
        to: data.to,
      });

      if (existingRoute) {
        return {
          success: false,
          message: 'A route with this origin and destination already exists',
        };
      }

      const route = new Route({
        routeName: data.routeName,
        from: data.from,
        to: data.to,
        branches: data.branches || [],
        transportationCharge: data.transportationCharge ?? 0,
        status: data.status || 'Active',
      });

      await route.save();

      return {
        success: true,
        message: 'Route created successfully',
        data: route,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error creating route',
      };
    }
  }

  // Get all routes with pagination and search
  async getAllRoutes(
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
          { routeName: { $regex: search, $options: 'i' } },
          { from: { $regex: search, $options: 'i' } },
          { to: { $regex: search, $options: 'i' } },
          { branches: { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = status;
      }

      const routes = await Route.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Route.countDocuments(query);

      return {
        success: true,
        data: {
          routes,
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
        message: error.message || 'Error fetching routes',
      };
    }
  }

  // Get route by ID
  async getRouteById(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid route ID',
        };
      }

      const route = await Route.findById(id);

      if (!route) {
        return {
          success: false,
          message: 'Route not found',
        };
      }

      return {
        success: true,
        data: route,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error fetching route',
      };
    }
  }

  // Update route
  async updateRoute(id: string, data: UpdateRouteInput): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid route ID',
        };
      }

      const route = await Route.findById(id);

      if (!route) {
        return {
          success: false,
          message: 'Route not found',
        };
      }

      // Check for duplicate origin/destination if either is being changed
      const newFrom = data.from ?? route.from;
      const newTo = data.to ?? route.to;
      if (newFrom !== route.from || newTo !== route.to) {
        const existingRoute = await Route.findOne({
          from: newFrom,
          to: newTo,
          _id: { $ne: id },
        });

        if (existingRoute) {
          return {
            success: false,
            message: 'A route with this origin and destination already exists',
          };
        }
      }

      Object.keys(data).forEach((key) => {
        if (data[key as keyof UpdateRouteInput] !== undefined) {
          (route as any)[key] = data[key as keyof UpdateRouteInput];
        }
      });

      await route.save();

      return {
        success: true,
        message: 'Route updated successfully',
        data: route,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating route',
      };
    }
  }

  // Update route status
  async updateRouteStatus(
    id: string,
    status: 'Active' | 'Inactive'
  ): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid route ID',
        };
      }

      const route = await Route.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!route) {
        return {
          success: false,
          message: 'Route not found',
        };
      }

      return {
        success: true,
        message: 'Route status updated successfully',
        data: route,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating route status',
      };
    }
  }

  // Update route branches (Branch Management - replaces the branch list)
  async updateBranches(id: string, branches: string[]): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid route ID',
        };
      }

      // Normalise: trim + remove empties + de-duplicate
      const cleaned = Array.from(
        new Set(
          (branches || [])
            .map((b) => (b || '').trim())
            .filter((b) => b.length > 0)
        )
      );

      const route = await Route.findByIdAndUpdate(
        id,
        { branches: cleaned },
        { new: true }
      );

      if (!route) {
        return {
          success: false,
          message: 'Route not found',
        };
      }

      return {
        success: true,
        message: 'Route branches updated successfully',
        data: route,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error updating route branches',
      };
    }
  }

  // Delete route
  async deleteRoute(id: string): Promise<ServiceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'Invalid route ID',
        };
      }

      const route = await Route.findById(id);

      if (!route) {
        return {
          success: false,
          message: 'Route not found',
        };
      }

      await Route.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Route deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error deleting route',
      };
    }
  }
}

export const routeService = new RouteService();
