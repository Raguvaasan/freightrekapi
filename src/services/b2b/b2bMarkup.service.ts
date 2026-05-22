import { Types } from 'mongoose';
import { B2bMarkup } from '../../models/b2b/b2bMarkup.model';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  statusCode?: number;
}

interface CreateB2bMarkupData {
  markupType: 'percentage' | 'fixed';
  markupValue: number;
}

export const b2bMarkupService = {
  /**
   * Get active B2B markup by category
   */
  async getMarkup(category: 'rate_calculator' | 'rate_card'): Promise<ServiceResponse> {
    try {
      const markup = await B2bMarkup.findOne({
        markupCategory: category,
        isActive: true,
      })
        .populate('createdBy', 'name email')
        .lean();

      if (!markup) {
        return {
          success: false,
          message: `No B2B ${category.replace('_', ' ')} markup found`,
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: {
          id: markup._id,
          markup_category: markup.markupCategory,
          markup_type: markup.markupType,
          markup_value: markup.markupValue,
          is_active: markup.isActive,
          created_by: markup.createdBy,
          created_at: markup.createdAt,
          updated_at: markup.updatedAt,
        },
        message: `B2B ${category.replace('_', ' ')} markup retrieved successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve B2B markup',
        statusCode: 500,
      };
    }
  },

  /**
   * Create or update B2B markup (global - one active per category)
   */
  async createOrUpdateMarkup(
    category: 'rate_calculator' | 'rate_card',
    data: CreateB2bMarkupData,
    currentUserId: string
  ): Promise<ServiceResponse> {
    try {
      const { markupType, markupValue } = data;

      if (markupType === 'percentage' && (markupValue < 0 || markupValue > 100)) {
        return {
          success: false,
          message: 'markup_value must be between 0 and 100 for percentage type',
          statusCode: 400,
        };
      }

      if (markupType === 'fixed' && markupValue < 0) {
        return {
          success: false,
          message: 'markup_value must be >= 0 for fixed type',
          statusCode: 400,
        };
      }

      const currentUserObjId = new Types.ObjectId(currentUserId);

      const existingMarkup = await B2bMarkup.findOne({
        markupCategory: category,
        isActive: true,
      });

      let result;
      let isUpdate = false;

      if (existingMarkup) {
        existingMarkup.markupType = markupType;
        existingMarkup.markupValue = markupValue;
        existingMarkup.updatedBy = currentUserObjId;
        result = await existingMarkup.save();
        isUpdate = true;
      } else {
        await B2bMarkup.updateMany(
          { markupCategory: category, isActive: true },
          { $set: { isActive: false } }
        );

        const newMarkup = new B2bMarkup({
          markupCategory: category,
          markupType,
          markupValue,
          isActive: true,
          createdBy: currentUserObjId,
          updatedBy: currentUserObjId,
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
          is_active: result.isActive,
          created_at: result.createdAt,
          updated_at: result.updatedAt,
        },
        message: `B2B ${category.replace('_', ' ')} markup ${isUpdate ? 'updated' : 'created'} successfully`,
        statusCode: isUpdate ? 200 : 201,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create/update B2B markup',
        statusCode: 500,
      };
    }
  },

  /**
   * Delete (deactivate) B2B markup
   */
  async deleteMarkup(markupId: string, currentUserId: string): Promise<ServiceResponse> {
    try {
      const markup = await B2bMarkup.findOne({
        _id: new Types.ObjectId(markupId),
        isActive: true,
      });

      if (!markup) {
        return {
          success: false,
          message: 'B2B markup not found',
          statusCode: 404,
        };
      }

      markup.isActive = false;
      markup.updatedBy = new Types.ObjectId(currentUserId);
      await markup.save();

      return {
        success: true,
        message: 'B2B markup deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete B2B markup',
        statusCode: 500,
      };
    }
  },
};
