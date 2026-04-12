import bcrypt from 'bcryptjs';
import { Customer } from '../models/customer/customer.model';
import { AppCustomer } from '../models/customer/appCustomer.model';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  status?: 'Active' | 'Inactive';
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  status?: 'Active' | 'Inactive';
}

export class CustomerService {
  // Create customer
  async createCustomer(data: CreateCustomerInput): Promise<ServiceResponse> {
    try {
      const [existingEmail, existingPhone] = await Promise.all([
        Customer.findOne({ email: data.email }).lean(),
        Customer.findOne({ phone: data.phone }).lean(),
      ]);

      if (existingEmail) {
        return { success: false, message: 'Customer with this email already exists' };
      }

      if (existingPhone) {
        return { success: false, message: 'Customer with this phone number already exists' };
      }

      const customer = new Customer(data);
      await customer.save();

      // Also create in appcustomers collection if not already exists
      const existingAppCustomer = await AppCustomer.findOne({ email: data.email });
      if (!existingAppCustomer) {
        const nameParts = data.name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
        const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        await AppCustomer.create({
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          countryCode: '+91',
          password: tempPassword,
          status: data.status || 'Active',
        });
      }

      return {
        success: true,
        message: 'Customer created successfully',
        data: customer,
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error creating customer' };
    }
  }

  // List all customers with pagination
  async getAllCustomers(
    page: number,
    limit: number,
    search?: string,
    status?: string
  ): Promise<ServiceResponse> {
    try {
      const query: any = {};

      if (status && (status === 'Active' || status === 'Inactive')) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;
      const [total, customers] = await Promise.all([
        Customer.countDocuments(query),
        Customer.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      return {
        success: true,
        data: {
          customers,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error fetching customers' };
    }
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<ServiceResponse> {
    try {
      const customer = await Customer.findById(id).lean();
      if (!customer) {
        return { success: false, message: 'Customer not found' };
      }
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error fetching customer' };
    }
  }

  // Update customer
  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<ServiceResponse> {
    try {
      const customer = await Customer.findById(id);
      if (!customer) {
        return { success: false, message: 'Customer not found' };
      }

      if (data.email && data.email !== customer.email) {
        const existingEmail = await Customer.findOne({ email: data.email, _id: { $ne: id } });
        if (existingEmail) {
          return { success: false, message: 'Email is already in use by another customer' };
        }
      }

      if (data.phone && data.phone !== customer.phone) {
        const existingPhone = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
        if (existingPhone) {
          return { success: false, message: 'Phone number is already in use by another customer' };
        }
      }

      const updated = await Customer.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

      return {
        success: true,
        message: 'Customer updated successfully',
        data: updated,
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error updating customer' };
    }
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<ServiceResponse> {
    try {
      const customer = await Customer.findById(id);
      if (!customer) {
        return { success: false, message: 'Customer not found' };
      }

      await Customer.findByIdAndDelete(id);

      return { success: true, message: 'Customer deleted successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error deleting customer' };
    }
  }
}

export const customerService = new CustomerService();
