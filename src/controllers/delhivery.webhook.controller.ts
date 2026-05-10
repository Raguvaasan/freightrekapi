import { Request, Response } from "express";
import {
  handleDelhiveryStatusUpdate,
  handleDelhiveryBulkStatusUpdate,
  DelhiveryWebhookPayload,
} from "../services/delhivery.webhook.service";

/**
 * POST /webhook/delhivery
 * Receives status update pushes from Delhivery.
 * Delhivery sends either a single object or an array of updates.
 */
export const delhiveryWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Delhivery may send a single update or an array
    if (Array.isArray(body)) {
      const result = await handleDelhiveryBulkStatusUpdate(body as DelhiveryWebhookPayload[]);
      return res.status(200).json(result);
    }

    // Single update
    const payload: DelhiveryWebhookPayload = body;
    const result = await handleDelhiveryStatusUpdate(payload);

    if (!result.success) {
      // Still return 200 to Delhivery to prevent retries for non-retryable errors
      return res.status(200).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    // Always return 200 to prevent Delhivery from retrying indefinitely
    // Log the error for internal debugging
    console.error("[Delhivery Webhook Error]", err.message);
    return res.status(200).json({ success: false, message: "Internal processing error" });
  }
};
