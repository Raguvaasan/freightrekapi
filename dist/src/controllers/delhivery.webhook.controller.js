"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delhiveryWebhook = void 0;
const delhivery_webhook_service_1 = require("../services/delhivery.webhook.service");
/**
 * POST /webhook/delhivery
 * Receives status update pushes from Delhivery.
 * Delhivery sends either a single object or an array of updates.
 */
const delhiveryWebhook = async (req, res) => {
    try {
        const body = req.body;
        // Delhivery may send a single update or an array
        if (Array.isArray(body)) {
            const result = await (0, delhivery_webhook_service_1.handleDelhiveryBulkStatusUpdate)(body);
            return res.status(200).json(result);
        }
        // Single update
        const payload = body;
        const result = await (0, delhivery_webhook_service_1.handleDelhiveryStatusUpdate)(payload);
        if (!result.success) {
            // Still return 200 to Delhivery to prevent retries for non-retryable errors
            return res.status(200).json(result);
        }
        return res.status(200).json(result);
    }
    catch (err) {
        // Always return 200 to prevent Delhivery from retrying indefinitely
        // Log the error for internal debugging
        console.error("[Delhivery Webhook Error]", err.message);
        return res.status(200).json({ success: false, message: "Internal processing error" });
    }
};
exports.delhiveryWebhook = delhiveryWebhook;
