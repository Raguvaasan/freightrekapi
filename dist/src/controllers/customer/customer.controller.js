"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomerById = exports.getAllCustomers = exports.createCustomer = void 0;
const customer_service_1 = require("../../services/customer.service");
const createCustomer = async (req, res) => {
    try {
        const result = await customer_service_1.customerService.createCustomer(req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.createCustomer = createCustomer;
const getAllCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const result = await customer_service_1.customerService.getAllCustomers(page, limit, search, status);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getAllCustomers = getAllCustomers;
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await customer_service_1.customerService.getCustomerById(id);
        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await customer_service_1.customerService.updateCustomer(id, req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await customer_service_1.customerService.deleteCustomer(id);
        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
};
exports.deleteCustomer = deleteCustomer;
