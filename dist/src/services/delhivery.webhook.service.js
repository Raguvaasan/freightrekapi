"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDelhiveryStatusUpdate = handleDelhiveryStatusUpdate;
exports.handleDelhiveryBulkStatusUpdate = handleDelhiveryBulkStatusUpdate;
const shipment_model_1 = require("../models/shipment/shipment.model");
/**
 * Delhivery Webhook Status Mapping
 * Maps Delhivery's StatusType/Status to our internal shipment status
 */
const STATUS_MAP = {
    // Manifested / Pickup Pending
    "Manifested": "created",
    "Not Picked": "created",
    "Pickup Scheduled": "created",
    // In Transit
    "In Transit": "in_transit",
    "Dispatched": "in_transit",
    "Out For Delivery": "in_transit",
    "Reached Destination Hub": "in_transit",
    "Pickup Complete": "in_transit",
    "In Air": "in_transit",
    // Delivered
    "Delivered": "delivered",
    // Failed / RTO
    "RTO": "failed",
    "RTO Delivered": "failed",
    "RTO In Transit": "failed",
    "Returned": "failed",
    "Undelivered": "failed",
    // Cancelled
    "Cancelled": "cancelled",
};
function mapDelhiveryStatus(delhiveryStatus) {
    // Direct match
    if (STATUS_MAP[delhiveryStatus]) {
        return STATUS_MAP[delhiveryStatus];
    }
    // Partial match (case-insensitive)
    const lower = delhiveryStatus.toLowerCase();
    if (lower.includes("delivered") && !lower.includes("undelivered") && !lower.includes("out for")) {
        return "delivered";
    }
    if (lower.includes("transit") || lower.includes("dispatched") || lower.includes("out for delivery")) {
        return "in_transit";
    }
    if (lower.includes("rto") || lower.includes("returned")) {
        return "failed";
    }
    if (lower.includes("cancel")) {
        return "cancelled";
    }
    if (lower.includes("manifest") || lower.includes("not picked") || lower.includes("pickup scheduled")) {
        return "created";
    }
    return null;
}
async function handleDelhiveryStatusUpdate(payload) {
    const { Waybill, Status, ReferenceNo } = payload;
    if (!Waybill) {
        return { success: false, message: "Waybill is required" };
    }
    const shipment = await shipment_model_1.Shipment.findOne({ waybill: Waybill });
    if (!shipment) {
        return { success: false, message: `Shipment not found for waybill: ${Waybill}` };
    }
    const newStatus = mapDelhiveryStatus(Status.Status);
    if (!newStatus) {
        // Unknown status — log but don't fail
        return {
            success: true,
            message: `Unknown Delhivery status "${Status.Status}" — no mapping. Shipment unchanged.`,
            data: { waybill: Waybill, currentStatus: shipment.status },
        };
    }
    // Don't downgrade status (e.g., delivered → in_transit)
    const statusPriority = {
        pending: 0,
        created: 1,
        Active: 2,
        in_transit: 3,
        delivered: 5,
        failed: 4,
        cancelled: 4,
    };
    const currentPriority = statusPriority[shipment.status] ?? 0;
    const newPriority = statusPriority[newStatus] ?? 0;
    if (newPriority <= currentPriority && shipment.status !== newStatus) {
        // Allow same status (idempotent), block downgrade
        if (newPriority < currentPriority) {
            return {
                success: true,
                message: `Status not downgraded. Current: "${shipment.status}", received: "${newStatus}"`,
                data: { waybill: Waybill, currentStatus: shipment.status },
            };
        }
    }
    shipment.status = newStatus;
    shipment.delhiveryResponse = {
        ...(shipment.delhiveryResponse || {}),
        lastWebhookUpdate: {
            status: Status.Status,
            statusCode: Status.StatusCode,
            statusType: Status.StatusType,
            statusDateTime: Status.StatusDateTime,
            statusLocation: Status.StatusLocation,
            instructions: Status.Instructions,
            receivedAt: new Date().toISOString(),
        },
    };
    await shipment.save();
    return {
        success: true,
        message: `Shipment status updated to "${newStatus}"`,
        data: {
            waybill: Waybill,
            orderId: shipment.orderId,
            previousStatus: shipment.status,
            newStatus,
            delhiveryStatus: Status.Status,
            updatedAt: Status.StatusDateTime,
        },
    };
}
/**
 * Handle bulk webhook payload (Delhivery can send multiple updates at once)
 */
async function handleDelhiveryBulkStatusUpdate(payloads) {
    const results = await Promise.allSettled(payloads.map((p) => handleDelhiveryStatusUpdate(p)));
    const summary = {
        total: payloads.length,
        success: 0,
        failed: 0,
        details: [],
    };
    for (const result of results) {
        if (result.status === "fulfilled" && result.value.success) {
            summary.success++;
        }
        else {
            summary.failed++;
        }
        summary.details.push(result.status === "fulfilled" ? result.value : { success: false, message: result.reason?.message });
    }
    return { success: true, data: summary };
}
