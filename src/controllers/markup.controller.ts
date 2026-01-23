import { Request, Response } from 'express';
import { markupService } from '../services/markup.service';

/**
 * Get Rate Calculator Markup
 */
export const getRateCalculatorMarkup = async (req: Request, res: Response) => {
  try {
    const { user_id, franchise_id } = req.query;

    const result = await markupService.getMarkup('rate_calculator', {
      userId: user_id as string,
      franchiseId: franchise_id as string,
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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * Create/Update Rate Calculator Markup
 */
export const createOrUpdateRateCalculatorMarkup = async (req: Request, res: Response) => {
  try {
    const { markup_type, markup_value, user_id, franchise_id } = req.body;
    const currentUserId = (req as any).user.id;

    const result = await markupService.createOrUpdateMarkup(
      'rate_calculator',
      {
        markupType: markup_type,
        markupValue: markup_value,
        userId: user_id,
        franchiseId: franchise_id,
      },
      currentUserId
    );

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * Get Rate Card Markup
 */
export const getRateCardMarkup = async (req: Request, res: Response) => {
  try {
    const { user_id, franchise_id } = req.query;

    const result = await markupService.getMarkup('rate_card', {
      userId: user_id as string,
      franchiseId: franchise_id as string,
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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * Create/Update Rate Card Markup
 */
export const createOrUpdateRateCardMarkup = async (req: Request, res: Response) => {
  try {
    const { markup_type, markup_value, user_id, franchise_id } = req.body;
    const currentUserId = (req as any).user.id;

    const result = await markupService.createOrUpdateMarkup(
      'rate_card',
      {
        markupType: markup_type,
        markupValue: markup_value,
        userId: user_id,
        franchiseId: franchise_id,
      },
      currentUserId
    );

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: err.message || 'Internal server error',
    });
  }
};
