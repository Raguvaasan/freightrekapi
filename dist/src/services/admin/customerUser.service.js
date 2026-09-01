"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomerUser = exports.updateCustomerUser = exports.getAllCustomerUsers = void 0;
const customerUser_model_1 = require("../../models/customer/customerUser.model");
const getAllCustomerUsers = async (page, limit) => {
    try {
        const skip = (page - 1) * limit;
        const [customers, total] = await Promise.all([
            customerUser_model_1.CustomerUser.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            customerUser_model_1.CustomerUser.countDocuments(),
        ]);
        return {
            success: true,
            data: customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.getAllCustomerUsers = getAllCustomerUsers;
const updateCustomerUser = async (id, updates) => {
    try {
        const customer = await customerUser_model_1.CustomerUser.findByIdAndUpdate(id, updates, { new: true });
        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }
        return { success: true, message: 'Customer updated successfully', data: customer };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.updateCustomerUser = updateCustomerUser;
const deleteCustomerUser = async (id) => {
    try {
        const customer = await customerUser_model_1.CustomerUser.findByIdAndDelete(id);
        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }
        return { success: true, message: 'Customer deleted successfully' };
    }
    catch (err) {
        return { success: false, message: err.message };
    }
};
exports.deleteCustomerUser = deleteCustomerUser;
