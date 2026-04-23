"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB connected");
    }
    catch (error) {
        console.error("DB connection failed", error);
        // Avoid killing the serverless function runtime; let caller decide how to handle the failure
        if (process.env.VERCEL) {
            throw error;
        }
        process.exit(1);
    }
};
exports.connectDB = connectDB;
