import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

/**
 * Reject a route parameter that cannot be an id, before anything else runs.
 *
 * A router that mounts `/:id` swallows every unmatched sub-path: a request for
 * `/admin/hub/dashboard` matches `GET /:id` with id="dashboard", reaches the
 * permission check and answers "Access denied" — which reads as a broken login
 * rather than a wrong URL. Failing fast here turns that into a plain 404.
 *
 * Register with `router.param('id', objectIdParam(base))` so it covers every
 * route in that router carrying the parameter, `/:id/status` included.
 */
export const objectIdParam =
  (base: string) =>
  (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!Types.ObjectId.isValid(value)) {
      return res.status(404).json({
        success: false,
        message: `No such endpoint ${base}/${value} — and "${value}" is not a valid ID`,
      });
    }
    return next();
  };
