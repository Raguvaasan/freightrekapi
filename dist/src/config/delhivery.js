"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delhiveryConfig = void 0;
exports.delhiveryConfig = {
    apiBaseUrl: process.env.DELHIVERY_API_BASE_URL || "https://staging-external.delhivery.com",
    apiKey: process.env.DELHIVERY_API_KEY || "",
};
