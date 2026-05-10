import type { VercelRequest, VercelResponse } from "@vercel/node";
import mongoose from "mongoose";
import { connectDB } from "../../src/config/db";
import { pollDelhiveryStatuses } from "../../src/services/delhivery.cron.service";

let connectionPromise: Promise<void> | null = null;

const ensureDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState !== 2) connectionPromise = null;
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err: any) => {
      connectionPromise = null;
      throw err;
    });
  }
  await connectionPromise;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the request is from Vercel Cron (security)
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    await ensureDatabase();
    const result = await pollDelhiveryStatuses();
    console.log(`[Vercel Cron] Delhivery sync: checked=${result.checked}, updated=${result.updated}, errors=${result.errors}`);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("[Vercel Cron] Delhivery sync failed:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
