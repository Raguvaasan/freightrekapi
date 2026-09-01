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
exports.deleteCollectionAgencyRole = exports.updateCollectionAgencyRole = exports.getCollectionAgencyRoleById = exports.getCollectionAgencyRoles = exports.createCollectionAgencyRole = void 0;
const collectionAgencyRoleService = __importStar(require("../../services/admin/collectionAgencyRole.service"));
/**
 * Create collection agency role
 */
const createCollectionAgencyRole = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency not authenticated',
            });
        }
        const result = await collectionAgencyRoleService.createCollectionAgencyRole(collectionAgencyId, req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json({ success: true, data: result.data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCollectionAgencyRole = createCollectionAgencyRole;
/**
 * Get all collection agency roles
 */
const getCollectionAgencyRoles = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency not authenticated',
            });
        }
        const result = await collectionAgencyRoleService.getCollectionAgencyRoles(collectionAgencyId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getCollectionAgencyRoles = getCollectionAgencyRoles;
/**
 * Get collection agency role by ID
 */
const getCollectionAgencyRoleById = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const roleId = req.params.id;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency not authenticated',
            });
        }
        const result = await collectionAgencyRoleService.getCollectionAgencyRoleById(collectionAgencyId, roleId);
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
exports.getCollectionAgencyRoleById = getCollectionAgencyRoleById;
/**
 * Update collection agency role
 */
const updateCollectionAgencyRole = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const roleId = req.params.id;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency not authenticated',
            });
        }
        const result = await collectionAgencyRoleService.updateCollectionAgencyRole(collectionAgencyId, roleId, req.body);
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
exports.updateCollectionAgencyRole = updateCollectionAgencyRole;
/**
 * Delete collection agency role
 */
const deleteCollectionAgencyRole = async (req, res) => {
    try {
        const collectionAgencyId = req.user?.id;
        const roleId = req.params.id;
        if (!collectionAgencyId) {
            return res.status(401).json({
                success: false,
                message: 'Collection agency not authenticated',
            });
        }
        const result = await collectionAgencyRoleService.deleteCollectionAgencyRole(collectionAgencyId, roleId);
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
exports.deleteCollectionAgencyRole = deleteCollectionAgencyRole;
