"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHubRole = exports.updateHubRole = exports.getHubRoleById = exports.getHubRoles = exports.createHubRole = void 0;
const hubRoleService = __importStar(require("../../services/hub/hubRole.service"));
const createHubRole = async (req, res) => {
    try {
        const hubId = req.user?.id;
        if (!hubId) {
            return res.status(401).json({
                success: false,
                message: 'Hub not authenticated',
            });
        }
        const result = await hubRoleService.createHubRole(hubId, req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json({ success: true, data: result.data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createHubRole = createHubRole;
const getHubRoles = async (req, res) => {
    try {
        const hubId = req.user?.id;
        if (!hubId) {
            return res.status(401).json({
                success: false,
                message: 'Hub not authenticated',
            });
        }
        const result = await hubRoleService.getHubRoles(hubId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getHubRoles = getHubRoles;
const getHubRoleById = async (req, res) => {
    try {
        const hubId = req.user?.id;
        const roleId = req.params.id;
        if (!hubId) {
            return res.status(401).json({
                success: false,
                message: 'Hub not authenticated',
            });
        }
        const result = await hubRoleService.getHubRoleById(hubId, roleId);
        if (!result.success) {
            const status = result.message === 'Role not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getHubRoleById = getHubRoleById;
const updateHubRole = async (req, res) => {
    try {
        const hubId = req.user?.id;
        const roleId = req.params.id;
        if (!hubId) {
            return res.status(401).json({
                success: false,
                message: 'Hub not authenticated',
            });
        }
        const result = await hubRoleService.updateHubRole(hubId, roleId, req.body);
        if (!result.success) {
            const status = result.message === 'Role not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateHubRole = updateHubRole;
const deleteHubRole = async (req, res) => {
    try {
        const hubId = req.user?.id;
        const roleId = req.params.id;
        if (!hubId) {
            return res.status(401).json({
                success: false,
                message: 'Hub not authenticated',
            });
        }
        const result = await hubRoleService.deleteHubRole(hubId, roleId);
        if (!result.success) {
            const status = result.message === 'Role not found' ? 404 : 400;
            return res.status(status).json(result);
        }
        res.status(200).json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteHubRole = deleteHubRole;
