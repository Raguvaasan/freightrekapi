"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteB2bMarkup = exports.createOrUpdateB2bRateCardMarkup = exports.getB2bRateCardMarkup = exports.createOrUpdateB2bRateCalculatorMarkup = exports.getB2bRateCalculatorMarkup = void 0;
const b2bMarkup_service_1 = require("../../services/b2b/b2bMarkup.service");
/**
 * Get B2B Rate Calculator Markup
 */
const getB2bRateCalculatorMarkup = async (req, res) => {
    try {
        const result = await b2bMarkup_service_1.b2bMarkupService.getMarkup('rate_calculator');
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                data: null,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            data: null,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getB2bRateCalculatorMarkup = getB2bRateCalculatorMarkup;
/**
 * Create/Update B2B Rate Calculator Markup
 */
const createOrUpdateB2bRateCalculatorMarkup = async (req, res) => {
    try {
        const { markup_type, markup_value } = req.body;
        const currentUserId = req.user.id;
        const result = await b2bMarkup_service_1.b2bMarkupService.createOrUpdateMarkup('rate_calculator', { markupType: markup_type, markupValue: markup_value }, currentUserId);
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                data: null,
                message: result.message,
            });
        }
        return res.status(result.statusCode || 200).json({
            success: true,
            data: result.data,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            data: null,
            message: err.message || 'Internal server error',
        });
    }
};
exports.createOrUpdateB2bRateCalculatorMarkup = createOrUpdateB2bRateCalculatorMarkup;
/**
 * Get B2B Rate Card Markup
 */
const getB2bRateCardMarkup = async (req, res) => {
    try {
        const result = await b2bMarkup_service_1.b2bMarkupService.getMarkup('rate_card');
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                data: null,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            data: null,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getB2bRateCardMarkup = getB2bRateCardMarkup;
/**
 * Create/Update B2B Rate Card Markup
 */
const createOrUpdateB2bRateCardMarkup = async (req, res) => {
    try {
        const { markup_type, markup_value } = req.body;
        const currentUserId = req.user.id;
        const result = await b2bMarkup_service_1.b2bMarkupService.createOrUpdateMarkup('rate_card', { markupType: markup_type, markupValue: markup_value }, currentUserId);
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                data: null,
                message: result.message,
            });
        }
        return res.status(result.statusCode || 200).json({
            success: true,
            data: result.data,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            data: null,
            message: err.message || 'Internal server error',
        });
    }
};
exports.createOrUpdateB2bRateCardMarkup = createOrUpdateB2bRateCardMarkup;
/**
 * Delete B2B Markup
 */
const deleteB2bMarkup = async (req, res) => {
    try {
        const id = req.params.id;
        const currentUserId = req.user.id;
        const result = await b2bMarkup_service_1.b2bMarkupService.deleteMarkup(id, currentUserId);
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                data: null,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            data: null,
            message: result.message,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            data: null,
            message: err.message || 'Internal server error',
        });
    }
};
exports.deleteB2bMarkup = deleteB2bMarkup;
