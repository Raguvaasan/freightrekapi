"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCollectionAgencyStatus = exports.deleteCollectionAgency = exports.updateCollectionAgency = exports.getCollectionAgencyById = exports.getAllCollectionAgencies = exports.createCollectionAgency = exports.verifyCollectionAgencyOtp = exports.sendCollectionAgencyOtp = void 0;
const collectionAgency_service_1 = require("../../services/admin/collectionAgency.service");
const sendCollectionAgencyOtp = async (req, res) => {
    try {
        const { phone, countryCode } = req.body;
        const result = await collectionAgency_service_1.collectionAgencyService.sendLoginOtp(phone, countryCode);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.sendCollectionAgencyOtp = sendCollectionAgencyOtp;
const verifyCollectionAgencyOtp = async (req, res) => {
    try {
        const { phone, countryCode, otp } = req.body;
        const result = await collectionAgency_service_1.collectionAgencyService.verifyLoginOtp(phone, countryCode, otp);
        if (!result.success) {
            return res.status(401).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
            token: result.token,
            data: result.data,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.verifyCollectionAgencyOtp = verifyCollectionAgencyOtp;
const createCollectionAgency = async (req, res) => {
    try {
        const result = await collectionAgency_service_1.collectionAgencyService.createCollectionAgency(req.body);
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
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.createCollectionAgency = createCollectionAgency;
const getAllCollectionAgencies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        const result = await collectionAgency_service_1.collectionAgencyService.getAllCollectionAgencies(page, limit, search, status);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAllCollectionAgencies = getAllCollectionAgencies;
const getCollectionAgencyById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await collectionAgency_service_1.collectionAgencyService.getCollectionAgencyById(String(id));
        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getCollectionAgencyById = getCollectionAgencyById;
const updateCollectionAgency = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await collectionAgency_service_1.collectionAgencyService.updateCollectionAgency(id, req.body);
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
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateCollectionAgency = updateCollectionAgency;
const deleteCollectionAgency = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await collectionAgency_service_1.collectionAgencyService.deleteCollectionAgency(id);
        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.deleteCollectionAgency = deleteCollectionAgency;
const updateCollectionAgencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await collectionAgency_service_1.collectionAgencyService.updateCollectionAgencyStatus(id, status);
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
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.updateCollectionAgencyStatus = updateCollectionAgencyStatus;
