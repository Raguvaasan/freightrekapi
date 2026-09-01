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
const hubRoleController = __importStar(require("../../controllers/hub/hubRole.controller"));
const hubRole_validator_1 = require("../../validators/hub/hubRole.validator");
const parcelActor_middleware_1 = require("../../middleware/parcelActor.middleware");
const hubModule_1 = require("../../config/hubModule");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, parcelActor_middleware_1.requireParcelRole)('hub'));
/**
 * A direct hub login manages its own roles; hub staff need the matching
 * "Access Management" permission on their HubRole.
 */
const access = (action) => (0, parcelActor_middleware_1.requireModulePermission)({ hub: (0, hubModule_1.hubPermission)(hubModule_1.hubModule.access_management) }, action);
/**
 * @swagger
 * /hub/role/modules:
 *   get:
 *     summary: Modules a hub role can be given permissions on
 *     description: Drives the hub role/permission screen.
 *     tags: [Hub Role]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: '{ modules: ["Dashboard", "Parcel Management", ...] }'
 */
router.get('/modules', access('read'), (_req, res) => res.status(200).json({ success: true, data: { modules: (0, hubModule_1.hubModules)() } }));
/**
 * @route   POST /hub/role
 * @desc    Create a new hub role
 * @access  Private (Hub only)
 */
router.post('/', access('write'), (0, validate_middleware_1.validate)(hubRole_validator_1.createHubRoleSchema), hubRoleController.createHubRole);
/**
 * @route   GET /hub/role
 * @desc    Get all hub roles
 * @access  Private (Hub only)
 */
router.get('/', access('read'), hubRoleController.getHubRoles);
/**
 * @route   GET /hub/role/:id
 * @desc    Get hub role by ID
 * @access  Private (Hub only)
 */
router.get('/:id', access('read'), hubRoleController.getHubRoleById);
/**
 * @route   PUT /hub/role/:id
 * @desc    Update hub role
 * @access  Private (Hub only)
 */
router.put('/:id', access('update'), (0, validate_middleware_1.validate)(hubRole_validator_1.updateHubRoleSchema), hubRoleController.updateHubRole);
/**
 * @route   DELETE /hub/role/:id
 * @desc    Delete hub role
 * @access  Private (Hub only)
 */
router.delete('/:id', access('delete'), hubRoleController.deleteHubRole);
exports.default = router;
