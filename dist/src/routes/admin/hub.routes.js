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
const hubController = __importStar(require("../../controllers/admin/hub.controller"));
const validate_middleware_1 = require("../../middleware/validate.middleware");
const hub_validator_1 = require("../../validators/admin/hub.validator");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const staff_validator_1 = require("../../validators/admin/staff.validator");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /admin/hub/login:
 *   post:
 *     summary: Hub direct login
 *     tags: [Hub Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Hub login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (0, validate_middleware_1.validate)(staff_validator_1.staffLoginSchema), hubController.loginHub);
/**
 * @swagger
 * /admin/hub/unified-login:
 *   post:
 *     summary: Unified login for both Hub admin and Hub staff
 *     tags: [Hub Management]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful (returns loginType 'hub' or 'hub_staff')
 *       401:
 *         description: Invalid credentials
 */
router.post('/unified-login', (0, validate_middleware_1.validate)(staff_validator_1.staffLoginSchema), hubController.unifiedHubLogin);
/**
 * @swagger
 * /admin/hub:
 *   post:
 *     summary: Create a new freight hub
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hub'
 *     responses:
 *       201:
 *         description: Hub created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Error creating hub
 *   get:
 *     summary: Get all hubs
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hubs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hub'
 */
router.post("/", auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.hub_management, 'write'), (0, validate_middleware_1.validate)(hub_validator_1.createHubSchema), hubController.createHub);
router.get("/", auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.hub_management, 'read'), hubController.getHubs);
/**
 * @swagger
 * /admin/hub/{id}:
 *   get:
 *     summary: Get hub by ID
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hub ID
 *     responses:
 *       200:
 *         description: Hub details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hub'
 *       404:
 *         description: Hub not found
 *   put:
 *     summary: Update hub
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hub'
 *     responses:
 *       200:
 *         description: Hub updated successfully
 *       404:
 *         description: Hub not found
 *   delete:
 *     summary: Delete hub
 *     tags: [Hub Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hub deleted successfully
 *       404:
 *         description: Hub not found
 */
router.get("/:id", auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.hub_management, 'read'), hubController.gethubById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.hub_management, 'update'), (0, validate_middleware_1.validate)(hub_validator_1.updateHubSchema), hubController.updateHub);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.hub_management, 'delete'), hubController.deleteHub);
exports.default = router;
