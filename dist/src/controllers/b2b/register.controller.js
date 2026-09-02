"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerB2b = void 0;
const auth_service_1 = require("../../services/b2b/auth.service");
const registerB2b = async (req, res) => {
    const result = await auth_service_1.b2bAuthService.register(req.body);
    return res.status(result.success ? 201 : 400).json(result);
};
exports.registerB2b = registerB2b;
