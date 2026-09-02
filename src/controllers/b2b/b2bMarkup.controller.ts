import { Request, Response } from 'express';
import { b2bMarkupService } from '../../services/b2b/b2bMarkup.service';

/**
 * Get B2B Rate Calculator Markup
 */
export const getB2bRateCalculatorMarkup = async (req: Request, res: Response) => {
  try {
    const result = await b2bMarkupService.getMarkup('rate_calculator');

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
 * Create/Update B2B Rate Calculator Markup
 */
export const createOrUpdateB2bRateCalculatorMarkup = async (req: Request, res: Response) => {
  try {
    const { markup_type, markup_value } = req.body;
    const currentUserId = (req as any).user.id;

    const result = await b2bMarkupService.createOrUpdateMarkup(
      'rate_calculator',
      { markupType: markup_type, markupValue: markup_value },
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
 * Get B2B Rate Card Markup
 */
export const getB2bRateCardMarkup = async (req: Request, res: Response) => {
  try {
    const result = await b2bMarkupService.getMarkup('rate_card');

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
 * Create/Update B2B Rate Card Markup
 */
export const createOrUpdateB2bRateCardMarkup = async (req: Request, res: Response) => {
  try {
    const { markup_type, markup_value } = req.body;
    const currentUserId = (req as any).user.id;

    const result = await b2bMarkupService.createOrUpdateMarkup(
      'rate_card',
      { markupType: markup_type, markupValue: markup_value },
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
 * Delete B2B Markup
 */
export const deleteB2bMarkup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUserId = (req as any).user.id;

    const result = await b2bMarkupService.deleteMarkup(id, currentUserId);

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      data: null,
      message: err.message || 'Internal server error',
    });
  }
};
