"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listB2bUsers = exports.updateB2bUser = exports.getB2bUser = exports.updateB2bProfile = exports.getB2bProfile = exports.registerB2b = void 0;
const auth_service_1 = require("../../services/b2b/auth.service");
const registerB2b = async (req, res) => {
    const result = await auth_service_1.b2bAuthService.register(req.body);
    return res.status(result.success ? 201 : 400).json(result);
};
exports.registerB2b = registerB2b;
const getB2bProfile = async (req, res) => res.json(await auth_service_1.b2bAuthService.getById(String(req.user.id)));
exports.getB2bProfile = getB2bProfile;
const updateB2bProfile = async (req, res) => res.json(await auth_service_1.b2bAuthService.update(String(req.user.id), req.body));
exports.updateB2bProfile = updateB2bProfile;
const getB2bUser = async (req, res) => res.json(await auth_service_1.b2bAuthService.getById(String(req.params.id)));
exports.getB2bUser = getB2bUser;
const updateB2bUser = async (req, res) => res.json(await auth_service_1.b2bAuthService.update(String(req.params.id), req.body));
exports.updateB2bUser = updateB2bUser;
const listB2bUsers = async (req, res) => res.json(await auth_service_1.b2bAuthService.list(req.query));
exports.listB2bUsers = listB2bUsers;
