"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdateRateCardMarkup = exports.getRateCardMarkup = exports.createOrUpdateRateCalculatorMarkup = exports.getRateCalculatorMarkup = void 0;
const markup_service_1 = require("../services/markup.service");
/**
 * Get Rate Calculator Markup
 */
const getRateCalculatorMarkup = async (req, res) => {
    try {
        const { user_id, franchise_id } = req.query;
        const result = await markup_service_1.markupService.getMarkup('rate_calculator', {
            userId: user_id,
            franchiseId: franchise_id,
        });
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
exports.getRateCalculatorMarkup = getRateCalculatorMarkup;
/**
 * Create/Update Rate Calculator Markup
 */
const createOrUpdateRateCalculatorMarkup = async (req, res) => {
    try {
        const { markup_type, markup_value, user_id, franchise_id } = req.body;
        const currentUserId = req.user.id;
        const result = await markup_service_1.markupService.createOrUpdateMarkup('rate_calculator', {
            markupType: markup_type,
            markupValue: markup_value,
            userId: user_id,
            franchiseId: franchise_id,
        }, currentUserId);
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
exports.createOrUpdateRateCalculatorMarkup = createOrUpdateRateCalculatorMarkup;
/**
 * Get Rate Card Markup
 */
const getRateCardMarkup = async (req, res) => {
    try {
        const { user_id, franchise_id } = req.query;
        const result = await markup_service_1.markupService.getMarkup('rate_card', {
            userId: user_id,
            franchiseId: franchise_id,
        });
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
exports.getRateCardMarkup = getRateCardMarkup;
/**
 * Create/Update Rate Card Markup
 */
const createOrUpdateRateCardMarkup = async (req, res) => {
    try {
        const { markup_type, markup_value, user_id, franchise_id } = req.body;
        const currentUserId = req.user.id;
        const result = await markup_service_1.markupService.createOrUpdateMarkup('rate_card', {
            markupType: markup_type,
            markupValue: markup_value,
            userId: user_id,
            franchiseId: franchise_id,
        }, currentUserId);
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
exports.createOrUpdateRateCardMarkup = createOrUpdateRateCardMarkup;
