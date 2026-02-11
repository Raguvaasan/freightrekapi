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
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const franchiseRoleController = __importStar(require("../../controllers/admin/franchiseRole.controller"));
const franchiseRole_validator_1 = require("../../validators/admin/franchiseRole.validator");
const router = (0, express_1.Router)();
/**
 * @route   POST /admin/franchise/role
 * @desc    Create a new franchise role
 * @access  Private (Franchise only)
 */
router.post('/', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(franchiseRole_validator_1.createFranchiseRoleSchema), franchiseRoleController.createFranchiseRole);
/**
 * @route   GET /admin/franchise/role
 * @desc    Get all franchise roles
 * @access  Private (Franchise only)
 */
router.get('/', auth_middleware_1.authMiddleware, franchiseRoleController.getFranchiseRoles);
/**
 * @route   GET /admin/franchise/role/:id
 * @desc    Get franchise role by ID
 * @access  Private (Franchise only)
 */
router.get('/:id', auth_middleware_1.authMiddleware, franchiseRoleController.getFranchiseRoleById);
/**
 * @route   PUT /admin/franchise/role/:id
 * @desc    Update franchise role
 * @access  Private (Franchise only)
 */
router.put('/:id', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(franchiseRole_validator_1.updateFranchiseRoleSchema), franchiseRoleController.updateFranchiseRole);
/**
 * @route   DELETE /admin/franchise/role/:id
 * @desc    Delete franchise role
 * @access  Private (Franchise only)
 */
router.delete('/:id', auth_middleware_1.authMiddleware, franchiseRoleController.deleteFranchiseRole);
exports.default = router;
