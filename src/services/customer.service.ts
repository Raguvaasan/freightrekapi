import { Customer } from '../models/customer/customer.model';

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
      const existingEmail = await Customer.findOne({ email: data.email });
      if (existingEmail) {
        return { success: false, message: 'Customer with this email already exists' };
      }

      const existingPhone = await Customer.findOne({ phone: data.phone });
      if (existingPhone) {
        return { success: false, message: 'Customer with this phone number already exists' };
      }

      const customer = new Customer(data);
      await customer.save();

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
      const total = await Customer.countDocuments(query);
      const customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

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
      const customer = await Customer.findById(id);
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
