"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../../src/config/db");
const delhivery_cron_service_1 = require("../../src/services/delhivery.cron.service");
let connectionPromise = null;
const ensureDatabase = async () => {
    if (mongoose_1.default.connection.readyState === 1)
        return;
    if (mongoose_1.default.connection.readyState !== 2)
        connectionPromise = null;
    if (!connectionPromise) {
        connectionPromise = (0, db_1.connectDB)().catch((err) => {
            connectionPromise = null;
            throw err;
        });
    }
    await connectionPromise;
};
async function handler(req, res) {
    // Verify the request is from Vercel Cron (security)
    const authHeader = req.headers["authorization"];
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        await ensureDatabase();
        const result = await (0, delhivery_cron_service_1.pollDelhiveryStatuses)();
        console.log(`[Vercel Cron] Delhivery sync: checked=${result.checked}, updated=${result.updated}, errors=${result.errors}`);
        return res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        console.error("[Vercel Cron] Delhivery sync failed:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
}
