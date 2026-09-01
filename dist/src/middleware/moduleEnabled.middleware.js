"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeature = void 0;
/**
 * Gate a whole route group behind a feature flag.
 *
 * A disabled group answers 410 Gone with an explanation rather than 404, so a
 * stale frontend gets a clear signal instead of looking like a routing bug.
 */
const requireFeature = (enabled, label) => (_req, res, next) => {
    if (!enabled) {
        return res.status(410).json({
            success: false,
            message: `${label} is not available. This module is currently hidden.`,
        });
    }
    next();
};
exports.requireFeature = requireFeature;
