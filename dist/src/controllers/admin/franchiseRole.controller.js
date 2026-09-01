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
exports.deleteFranchiseRole = exports.updateFranchiseRole = exports.getFranchiseRoleById = exports.getFranchiseRoles = exports.createFranchiseRole = void 0;
const franchiseRoleService = __importStar(require("../../services/admin/franchiseRole.service"));
const parcelActor_1 = require("../../utils/parcelActor");
/**
 * The agency these roles belong to. A direct agency login is the agency; an
 * agency staff member has an id of their own, so the agency is read off their
 * record.
 */
const agencyOf = (req) => req.parcelActor?.agencyId
    ? Promise.resolve(req.parcelActor.agencyId)
    : (0, parcelActor_1.resolveAgencyId)(req.user?.id);
/**
 * Create franchise role
 */
const createFranchiseRole = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise not authenticated',
            });
        }
        const result = await franchiseRoleService.createFranchiseRole(franchiseId, req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json({ success: true, data: result.data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createFranchiseRole = createFranchiseRole;
/**
 * Get all franchise roles
 */
const getFranchiseRoles = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise not authenticated',
            });
        }
        const result = await franchiseRoleService.getFranchiseRoles(franchiseId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getFranchiseRoles = getFranchiseRoles;
/**
 * Get franchise role by ID
 */
const getFranchiseRoleById = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const roleId = req.params.id;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise not authenticated',
            });
        }
        const result = await franchiseRoleService.getFranchiseRoleById(franchiseId, roleId);
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
exports.getFranchiseRoleById = getFranchiseRoleById;
/**
 * Update franchise role
 */
const updateFranchiseRole = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const roleId = req.params.id;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise not authenticated',
            });
        }
        const result = await franchiseRoleService.updateFranchiseRole(franchiseId, roleId, req.body);
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
exports.updateFranchiseRole = updateFranchiseRole;
/**
 * Delete franchise role
 */
const deleteFranchiseRole = async (req, res) => {
    try {
        const franchiseId = await agencyOf(req);
        const roleId = req.params.id;
        if (!franchiseId) {
            return res.status(401).json({
                success: false,
                message: 'Franchise not authenticated',
            });
        }
        const result = await franchiseRoleService.deleteFranchiseRole(franchiseId, roleId);
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
exports.deleteFranchiseRole = deleteFranchiseRole;
