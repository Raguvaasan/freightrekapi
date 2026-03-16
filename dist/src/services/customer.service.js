"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const customer_model_1 = require("../models/customer/customer.model");
class CustomerService {
    // Create customer
    async createCustomer(data) {
        try {
            const existingEmail = await customer_model_1.Customer.findOne({ email: data.email });
            if (existingEmail) {
                return { success: false, message: 'Customer with this email already exists' };
            }
            const existingPhone = await customer_model_1.Customer.findOne({ phone: data.phone });
            if (existingPhone) {
                return { success: false, message: 'Customer with this phone number already exists' };
            }
            const customer = new customer_model_1.Customer(data);
            await customer.save();
            return {
                success: true,
                message: 'Customer created successfully',
                data: customer,
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error creating customer' };
        }
    }
    // List all customers with pagination
    async getAllCustomers(page, limit, search, status) {
        try {
            const query = {};
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
            const total = await customer_model_1.Customer.countDocuments(query);
            const customers = await customer_model_1.Customer.find(query)
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
        }
        catch (error) {
            return { success: false, message: error.message || 'Error fetching customers' };
        }
    }
    // Get customer by ID
    async getCustomerById(id) {
        try {
            const customer = await customer_model_1.Customer.findById(id);
            if (!customer) {
                return { success: false, message: 'Customer not found' };
            }
            return { success: true, data: customer };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error fetching customer' };
        }
    }
    // Update customer
    async updateCustomer(id, data) {
        try {
            const customer = await customer_model_1.Customer.findById(id);
            if (!customer) {
                return { success: false, message: 'Customer not found' };
            }
            if (data.email && data.email !== customer.email) {
                const existingEmail = await customer_model_1.Customer.findOne({ email: data.email, _id: { $ne: id } });
                if (existingEmail) {
                    return { success: false, message: 'Email is already in use by another customer' };
                }
            }
            if (data.phone && data.phone !== customer.phone) {
                const existingPhone = await customer_model_1.Customer.findOne({ phone: data.phone, _id: { $ne: id } });
                if (existingPhone) {
                    return { success: false, message: 'Phone number is already in use by another customer' };
                }
            }
            const updated = await customer_model_1.Customer.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
            return {
                success: true,
                message: 'Customer updated successfully',
                data: updated,
            };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error updating customer' };
        }
    }
    // Delete customer
    async deleteCustomer(id) {
        try {
            const customer = await customer_model_1.Customer.findById(id);
            if (!customer) {
                return { success: false, message: 'Customer not found' };
            }
            await customer_model_1.Customer.findByIdAndDelete(id);
            return { success: true, message: 'Customer deleted successfully' };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error deleting customer' };
        }
    }
}
exports.CustomerService = CustomerService;
exports.customerService = new CustomerService();
