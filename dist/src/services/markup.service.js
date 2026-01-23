"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markupService = void 0;
const mongoose_1 = require("mongoose");
const markup_model_1 = require("../models/markup/markup.model");
exports.markupService = {
    /**
     * Get markup configuration with priority hierarchy
     * Priority: User-specific > Franchise-specific > Global
     */
    async getMarkup(category, query) {
        try {
            const { userId, franchiseId } = query;
            // Build priority-based queries
            const queries = [];
            // Priority 1: User-specific markup
            if (userId) {
                queries.push({
                    markupCategory: category,
                    userId: new mongoose_1.Types.ObjectId(userId),
                    isActive: true,
                });
            }
            // Priority 2: Franchise-specific markup
            if (franchiseId) {
                queries.push({
                    markupCategory: category,
                    franchiseId: new mongoose_1.Types.ObjectId(franchiseId),
                    userId: null,
                    isActive: true,
                });
            }
            // Priority 3: Global markup
            queries.push({
                markupCategory: category,
                userId: null,
                franchiseId: null,
                isActive: true,
            });
            // Try each query in order of priority
            for (const queryCondition of queries) {
                const markup = await markup_model_1.Markup.findOne(queryCondition).lean();
                if (markup) {
                    return {
                        success: true,
                        data: {
                            id: markup._id,
                            markup_category: markup.markupCategory,
                            markup_type: markup.markupType,
                            markup_value: markup.markupValue,
                            user_id: markup.userId,
                            franchise_id: markup.franchiseId,
                            is_active: markup.isActive,
                            created_at: markup.createdAt,
                            updated_at: markup.updatedAt,
                        },
                        message: `${category.replace('_', ' ')} markup retrieved successfully`,
                    };
                }
            }
            // No markup found
            return {
                success: false,
                message: 'No markup configuration found',
                statusCode: 404,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to retrieve markup',
                statusCode: 500,
            };
        }
    },
    /**
     * Create or update markup configuration (Upsert)
     */
    async createOrUpdateMarkup(category, data, currentUserId) {
        try {
            const { markupType, markupValue, userId, franchiseId } = data;
            // Validation: Percentage must be 0-100
            if (markupType === 'percentage' && (markupValue < 0 || markupValue > 100)) {
                return {
                    success: false,
                    message: 'Validation error: markup_value must be between 0 and 100 for percentage type',
                    statusCode: 400,
                };
            }
            // Validation: Fixed must be >= 0
            if (markupType === 'fixed' && markupValue < 0) {
                return {
                    success: false,
                    message: 'Validation error: markup_value must be >= 0 for fixed type',
                    statusCode: 400,
                };
            }
            const userIdObj = userId ? new mongoose_1.Types.ObjectId(userId) : null;
            const franchiseIdObj = franchiseId ? new mongoose_1.Types.ObjectId(franchiseId) : null;
            const currentUserIdObj = new mongoose_1.Types.ObjectId(currentUserId);
            // Check if active markup exists
            const existingMarkup = await markup_model_1.Markup.findOne({
                markupCategory: category,
                userId: userIdObj,
                franchiseId: franchiseIdObj,
                isActive: true,
            });
            let result;
            let isUpdate = false;
            if (existingMarkup) {
                // Update existing markup
                existingMarkup.markupType = markupType;
                existingMarkup.markupValue = markupValue;
                existingMarkup.updatedBy = currentUserIdObj;
                result = await existingMarkup.save();
                isUpdate = true;
            }
            else {
                // Deactivate all previous markups for this category/user/franchise combination
                await markup_model_1.Markup.updateMany({
                    markupCategory: category,
                    userId: userIdObj,
                    franchiseId: franchiseIdObj,
                    isActive: true,
                }, {
                    $set: { isActive: false },
                });
                // Create new markup
                const newMarkup = new markup_model_1.Markup({
                    markupCategory: category,
                    markupType,
                    markupValue,
                    userId: userIdObj,
                    franchiseId: franchiseIdObj,
                    isActive: true,
                    createdBy: currentUserIdObj,
                    updatedBy: currentUserIdObj,
                });
                result = await newMarkup.save();
            }
            return {
                success: true,
                data: {
                    id: result._id,
                    markup_category: result.markupCategory,
                    markup_type: result.markupType,
                    markup_value: result.markupValue,
                    user_id: result.userId,
                    franchise_id: result.franchiseId,
                    is_active: result.isActive,
                    created_at: result.createdAt,
                    updated_at: result.updatedAt,
                },
                message: `${category.replace('_', ' ')} markup ${isUpdate ? 'updated' : 'created'} successfully`,
                statusCode: isUpdate ? 200 : 201,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to create/update markup',
                statusCode: 500,
            };
        }
    },
};
