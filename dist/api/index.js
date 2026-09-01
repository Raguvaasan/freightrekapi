"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/config/db");
let connectionPromise = null;
const ensureDatabase = async () => {
    // Connected and ready
    if (mongoose_1.default.connection.readyState === 1) {
        return;
    }
    // Reset promise if previous connection dropped
    if (mongoose_1.default.connection.readyState !== 2) {
        connectionPromise = null;
    }
    if (!connectionPromise) {
        connectionPromise = (0, db_1.connectDB)().catch((err) => {
            connectionPromise = null;
            throw err;
        });
    }
    await connectionPromise;
};
async function handler(req, res) {
    try {
        await ensureDatabase();
        return (0, app_1.default)(req, res);
    }
    catch (error) {
        console.error('API handler error', error);
        // This response bypasses the express CORS middleware, so set the headers
        // here too — otherwise the browser reports a CORS failure instead of a 500
        const origin = req.headers.origin;
        if (typeof origin === 'string' && origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Vary', 'Origin');
        }
        else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.status(500).json({ success: false, message: error?.message || 'Internal Server Error' });
    }
}
