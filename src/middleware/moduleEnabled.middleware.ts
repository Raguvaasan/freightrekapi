import { Request, Response, NextFunction } from 'express';

/**
 * Gate a whole route group behind a feature flag.
 *
 * A disabled group answers 410 Gone with an explanation rather than 404, so a
 * stale frontend gets a clear signal instead of looking like a routing bug.
 */
export const requireFeature =
  (enabled: boolean, label: string) =>
  (_req: Request, res: Response, next: NextFunction) => {
    if (!enabled) {
      return res.status(410).json({
        success: false,
        message: `${label} is not available. This module is currently hidden.`,
      });
    }
    next();
  };
