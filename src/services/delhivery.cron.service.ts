import axios from "axios";
import { Shipment } from "../models/shipment/shipment.model";

type IShipmentStatus = "pending" | "created" | "Active" | "in_transit" | "delivered" | "failed" | "cancelled";

/**
 * Delhivery status → Internal status mapping
 */
const STATUS_MAP: Record<string, IShipmentStatus> = {
  "Manifested": "created",
  "Not Picked": "created",
  "Pickup Scheduled": "created",
  "In Transit": "in_transit",
  "Dispatched": "in_transit",
  "Out For Delivery": "in_transit",
  "Reached Destination Hub": "in_transit",
  "Pickup Complete": "in_transit",
  "In Air": "in_transit",
  "Delivered": "delivered",
  "RTO": "failed",
  "RTO Delivered": "failed",
  "RTO In Transit": "failed",
  "Returned": "failed",
  "Undelivered": "failed",
  "Cancelled": "cancelled",
};

const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  created: 1,
  Active: 2,
  in_transit: 3,
  failed: 4,
  cancelled: 4,
  delivered: 5,
};

function mapDelhiveryStatus(delhiveryStatus: string): IShipmentStatus | null {
  if (STATUS_MAP[delhiveryStatus]) return STATUS_MAP[delhiveryStatus];

  const lower = delhiveryStatus.toLowerCase();
  if (lower.includes("delivered") && !lower.includes("undelivered") && !lower.includes("out for")) return "delivered";
  if (lower.includes("transit") || lower.includes("dispatched") || lower.includes("out for delivery")) return "in_transit";
  if (lower.includes("rto") || lower.includes("returned")) return "failed";
  if (lower.includes("cancel")) return "cancelled";
  if (lower.includes("manifest") || lower.includes("not picked")) return "created";

  return null;
}

/**
 * Polls Delhivery tracking API for all active shipments and updates status in DB.
 */
async function pollDelhiveryStatuses(): Promise<{ updated: number; checked: number; errors: number }> {
  const delhiveryUrl =
    process.env.DELHIVERY_API_URL ||
    process.env.DELHIVERY_API_BASE_URL ||
    "https://track.delhivery.com";
  const delhiveryToken = (process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_API_KEY || "").trim();

  if (!delhiveryToken) {
    console.warn("[Delhivery Cron] API token not configured. Skipping.");
    return { updated: 0, checked: 0, errors: 0 };
  }

  // Find all shipments with a waybill that are not in a terminal state
  const activeShipments = await Shipment.find({
    waybill: { $exists: true, $nin: [null, ""] },
    status: { $in: ["created", "Active", "in_transit"] },
  }).select("orderId waybill status delhiveryResponse");

  if (activeShipments.length === 0) {
    return { updated: 0, checked: 0, errors: 0 };
  }

  let updated = 0;
  let errors = 0;

  // Process in batches of 10 to avoid rate limiting
  const BATCH_SIZE = 10;
  for (let i = 0; i < activeShipments.length; i += BATCH_SIZE) {
    const batch = activeShipments.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (shipment) => {
        try {
          const response = await axios.get(
            `${delhiveryUrl}/api/v1/packages/json/?waybill=${shipment.waybill}`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Token ${delhiveryToken}`,
              },
              timeout: 10000,
            }
          );

          const pkg = response.data?.ShipmentData?.[0]?.Shipment;
          if (!pkg) return;

          const latestStatus = pkg.Status?.Status || pkg.Status?.StatusType || "";
          const newStatus = mapDelhiveryStatus(latestStatus);

          if (!newStatus) return;

          const currentPriority = STATUS_PRIORITY[shipment.status] ?? 0;
          const newPriority = STATUS_PRIORITY[newStatus] ?? 0;

          // Only update if status moves forward
          if (newPriority > currentPriority) {
            shipment.status = newStatus;
            shipment.delhiveryResponse = {
              ...((shipment.delhiveryResponse as any) || {}),
              lastPollUpdate: {
                status: latestStatus,
                statusDateTime: pkg.Status?.StatusDateTime,
                statusLocation: pkg.Status?.StatusLocation,
                instructions: pkg.Status?.Instructions,
                polledAt: new Date().toISOString(),
              },
            };
            await shipment.save();
            updated++;
            console.log(`[Delhivery Cron] ${shipment.waybill}: ${shipment.status} → ${newStatus}`);
          }
        } catch (err: any) {
          errors++;
          console.error(`[Delhivery Cron] Error tracking ${shipment.waybill}:`, err.message);
        }
      })
    );

    // Small delay between batches to be respectful to Delhivery's API
    if (i + BATCH_SIZE < activeShipments.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return { updated, checked: activeShipments.length, errors };
}

let cronInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the Delhivery status polling cron.
 * Default: every 30 minutes. Configurable via DELHIVERY_POLL_INTERVAL_MS env var.
 */
export function startDelhiveryStatusCron() {
  const intervalMs = parseInt(process.env.DELHIVERY_POLL_INTERVAL_MS || "", 10) || 30 * 60 * 1000; // 30 min default

  console.log(`[Delhivery Cron] Starting status polling every ${intervalMs / 60000} minutes`);

  // Run once immediately on startup (delayed 10s to let DB connect)
  setTimeout(async () => {
    try {
      const result = await pollDelhiveryStatuses();
      console.log(`[Delhivery Cron] Initial poll: checked=${result.checked}, updated=${result.updated}, errors=${result.errors}`);
    } catch (err: any) {
      console.error("[Delhivery Cron] Initial poll failed:", err.message);
    }
  }, 10000);

  // Schedule recurring polls
  cronInterval = setInterval(async () => {
    try {
      const result = await pollDelhiveryStatuses();
      if (result.checked > 0) {
        console.log(`[Delhivery Cron] Poll: checked=${result.checked}, updated=${result.updated}, errors=${result.errors}`);
      }
    } catch (err: any) {
      console.error("[Delhivery Cron] Poll failed:", err.message);
    }
  }, intervalMs);
}

export function stopDelhiveryStatusCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("[Delhivery Cron] Stopped");
  }
}

/**
 * Manual trigger — can be called from an admin API endpoint
 */
export { pollDelhiveryStatuses };
