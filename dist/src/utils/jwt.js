"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
const generateToken = (userId) => {
    const options = {
        expiresIn: (JWT_EXPIRES_IN || '7d'),
    };
    return jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, options);
};
exports.generateToken = generateToken;
