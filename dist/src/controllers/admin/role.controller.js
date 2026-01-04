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
exports.deleteRole = exports.updateRole = exports.getRolesById = exports.getRoles = exports.createRole = exports.createRoleSetup = void 0;
const roleService = __importStar(require("../../services/admin/role.service"));
/**
 * Create role - For initial setup (no auth required)
 * Only works if no roles exist in database
 */
const createRoleSetup = async (req, res) => {
    try {
        const existingRolesResult = await roleService.getRoles();
        if (!existingRolesResult.success) {
            return res.status(400).json(existingRolesResult);
        }
        const existingRoles = existingRolesResult.data || [];
        if (existingRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Setup already completed. Use authenticated endpoint to create more roles."
            });
        }
        const createResult = await roleService.createRole(req.body);
        if (!createResult.success) {
            return res.status(400).json(createResult);
        }
        res.status(201).json({ success: true, message: "Setup role created", data: createResult.data });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createRoleSetup = createRoleSetup;
const createRole = async (req, res) => {
    try {
        const result = await roleService.createRole(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(201).json({ success: true, data: result.data });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createRole = createRole;
const getRoles = async (req, res) => {
    try {
        const result = await roleService.getRoles();
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.getRoles = getRoles;
const getRolesById = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await roleService.getRolesById(id);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.getRolesById = getRolesById;
const updateRole = async (req, res) => {
    try {
        const id = req.params.id;
        const rb = req.body;
        const result = await roleService.updateRole(id, rb);
        if (!result.success) {
            const status = result.message === "Role not found" ? 404 : 400;
            return res.status(status).json(result);
        }
        res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await roleService.deleteRole(id);
        if (!result.success) {
            const status = result.message === "Role not found" ? 404 : 400;
            return res.status(status).json(result);
        }
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.deleteRole = deleteRole;
