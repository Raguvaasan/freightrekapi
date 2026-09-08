"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminB2bInvoiceByOrder = exports.getB2bInvoiceByOrder = void 0;
const b2bUser_model_1 = require("../../models/b2b/b2bUser.model");
const invoice_service_1 = require("../../services/b2b/invoice.service");
const getB2bInvoiceByOrder = async (req, res) => {
    const user = await b2bUser_model_1.B2bUser.findOne({ _id: req.user?.id, status: 'Active' });
    if (!user)
        return res.status(403).json({ success: false, message: 'Active B2B customer access required' });
    try {
        const result = await invoice_service_1.b2bInvoiceService.getByOrder(String(req.query.orderId), user._id.toString());
        return res.status(result.success ? 200 : result.code || 400).json(result);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Error fetching B2B invoice' });
    }
};
exports.getB2bInvoiceByOrder = getB2bInvoiceByOrder;
const getAdminB2bInvoiceByOrder = async (req, res) => {
    try {
        const result = await invoice_service_1.b2bInvoiceService.getByOrder(String(req.query.orderId));
        return res.status(result.success ? 200 : result.code || 400).json(result);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Error fetching B2B invoice' });
    }
};
exports.getAdminB2bInvoiceByOrder = getAdminB2bInvoiceByOrder;
