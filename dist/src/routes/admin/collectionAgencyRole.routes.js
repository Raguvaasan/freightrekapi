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
const collectionAgencyRoleController = __importStar(require("../../controllers/admin/collectionAgencyRole.controller"));
const collectionAgencyRole_validator_1 = require("../../validators/admin/collectionAgencyRole.validator");
const router = (0, express_1.Router)();
/**
 * @route   POST /admin/collection-agency/role
 * @desc    Create a new collection agency role
 * @access  Private (Collection Agency only)
 */
router.post('/', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(collectionAgencyRole_validator_1.createCollectionAgencyRoleSchema), collectionAgencyRoleController.createCollectionAgencyRole);
/**
 * @route   GET /admin/collection-agency/role
 * @desc    Get all collection agency roles
 * @access  Private (Collection Agency only)
 */
router.get('/', auth_middleware_1.authMiddleware, collectionAgencyRoleController.getCollectionAgencyRoles);
/**
 * @route   GET /admin/collection-agency/role/:id
 * @desc    Get collection agency role by ID
 * @access  Private (Collection Agency only)
 */
router.get('/:id', auth_middleware_1.authMiddleware, collectionAgencyRoleController.getCollectionAgencyRoleById);
/**
 * @route   PUT /admin/collection-agency/role/:id
 * @desc    Update collection agency role
 * @access  Private (Collection Agency only)
 */
router.put('/:id', auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(collectionAgencyRole_validator_1.updateCollectionAgencyRoleSchema), collectionAgencyRoleController.updateCollectionAgencyRole);
/**
 * @route   DELETE /admin/collection-agency/role/:id
 * @desc    Delete collection agency role
 * @access  Private (Collection Agency only)
 */
router.delete('/:id', auth_middleware_1.authMiddleware, collectionAgencyRoleController.deleteCollectionAgencyRole);
exports.default = router;
