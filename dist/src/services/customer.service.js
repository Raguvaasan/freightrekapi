"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const customer_model_1 = require("../models/customer/customer.model");
const appCustomer_model_1 = require("../models/customer/appCustomer.model");
class CustomerService {
    // Create customer
    async createCustomer(data) {
        try {
            const [existingEmail, existingPhone] = await Promise.all([
                customer_model_1.Customer.findOne({ email: data.email }).lean(),
                customer_model_1.Customer.findOne({ phone: data.phone }).lean(),
            ]);
            if (existingEmail) {
                return { success: false, message: 'Customer with this email already exists' };
            }
            if (existingPhone) {
                return { success: false, message: 'Customer with this phone number already exists' };
            }
            const customer = new customer_model_1.Customer(data);
            await customer.save();
            // Also create in appcustomers collection if not already exists
            const existingAppCustomer = await appCustomer_model_1.AppCustomer.findOne({ email: data.email });
            if (!existingAppCustomer) {
                const nameParts = data.name.trim().split(/\s+/);
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
                const tempPassword = await bcryptjs_1.default.hash(Math.random().toString(36).slice(-8), 10);
                await appCustomer_model_1.AppCustomer.create({
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
            const [total, customers] = await Promise.all([
                customer_model_1.Customer.countDocuments(query),
                customer_model_1.Customer.find(query)
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
        }
        catch (error) {
            return { success: false, message: error.message || 'Error fetching customers' };
        }
    }
    // Get customer by ID
    async getCustomerById(id) {
        try {
            const customer = await customer_model_1.Customer.findById(id).lean();
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
            // Delete from both Customer (admin) and AppCustomer (login) collections
            await customer_model_1.Customer.findByIdAndDelete(id);
            if (customer.email || customer.phone) {
                const query = {};
                if (customer.email)
                    query.email = customer.email;
                if (customer.phone)
                    query.phone = customer.phone;
                await appCustomer_model_1.AppCustomer.findOneAndDelete(query);
            }
            return { success: true, message: 'Customer deleted successfully' };
        }
        catch (error) {
            return { success: false, message: error.message || 'Error deleting customer' };
        }
    }
}
exports.CustomerService = CustomerService;
exports.customerService = new CustomerService();
