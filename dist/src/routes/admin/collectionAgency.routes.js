"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const collectionAgency_controller_1 = require("../../controllers/admin/collectionAgency.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const collectionAgency_validator_1 = require("../../validators/admin/collectionAgency.validator");
const checkPermission_middleware_1 = require("../../middleware/checkPermission.middleware");
const adminModule_1 = require("../../config/adminModule");
const collectionAgency_staff_routes_1 = __importDefault(require("./collectionAgency-staff.routes"));
const collectionAgencyRole_routes_1 = __importDefault(require("./collectionAgencyRole.routes"));
const collectionAgency_order_routes_1 = __importDefault(require("./collectionAgency-order.routes"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /admin/collection-agency/login/send-otp:
 *   post:
 *     summary: Send OTP to collection agency phone for login
 *     tags: [Collection Agency Management]
 *     security: []
 *   /admin/collection-agency/login/verify-otp:
 *     post:
 *       summary: Verify OTP and login collection agency (returns JWT token)
 *       tags: [Collection Agency Management]
 *       security: []
 */
// Public routes - OTP login only
router.post('/login/send-otp', (0, validate_middleware_1.validate)(collectionAgency_validator_1.collectionAgencySendOtpSchema), collectionAgency_controller_1.sendCollectionAgencyOtp);
router.post('/login/verify-otp', (0, validate_middleware_1.validate)(collectionAgency_validator_1.collectionAgencyVerifyOtpSchema), collectionAgency_controller_1.verifyCollectionAgencyOtp);
// Collection agency portal sub-routes (authenticated with the collection agency's own JWT).
// Mounted BEFORE the admin authMiddleware and the '/:id' routes so '/staff' and '/role'
// are matched as literal paths instead of being treated as an ':id'.
router.use('/staff', collectionAgency_staff_routes_1.default);
router.use('/role', collectionAgencyRole_routes_1.default);
router.use('/orders', collectionAgency_order_routes_1.default);
// All remaining routes require admin authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @swagger
 * /admin/collection-agency:
 *   post:
 *     summary: Create a new collection agency
 *     tags: [Collection Agency Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Collection agency created successfully
 *       400:
 *         description: Validation error or collection agency already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *   get:
 *     summary: Get all collection agencies with pagination and filters
 *     tags: [Collection Agency Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: List of collection agencies
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 */
router.post('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.collection_agency_management, 'write'), (0, validate_middleware_1.validate)(collectionAgency_validator_1.createCollectionAgencySchema), collectionAgency_controller_1.createCollectionAgency);
router.get('/', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.collection_agency_management, 'read'), collectionAgency_controller_1.getAllCollectionAgencies);
/**
 * @swagger
 * /admin/collection-agency/{id}:
 *   get:
 *     summary: Get collection agency by ID
 *     tags: [Collection Agency Management]
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
 *         description: Collection agency details
 *       404:
 *         description: Collection agency not found
 *   put:
 *     summary: Update collection agency
 *     tags: [Collection Agency Management]
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
 *         description: Collection agency updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Collection agency not found
 *   delete:
 *     summary: Delete collection agency
 *     tags: [Collection Agency Management]
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
 *         description: Collection agency deleted successfully
 *       404:
 *         description: Collection agency not found
 */
router.get('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.collection_agency_management, 'read'), (0, validate_middleware_1.validate)(collectionAgency_validator_1.getCollectionAgencyByIdSchema), collectionAgency_controller_1.getCollectionAgencyById);
router.put('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.collection_agency_management, 'update'), (0, validate_middleware_1.validate)(collectionAgency_validator_1.updateCollectionAgencySchema), collectionAgency_controller_1.updateCollectionAgency);
/**
 * @swagger
 * /admin/collection-agency/{id}/status:
 *   patch:
 *     summary: Update collection agency status
 *     tags: [Collection Agency Management]
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
 *         description: Status updated successfully
 *       404:
 *         description: Collection agency not found
 */
router.patch('/:id/status', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.collection_agency_management, 'update'), (0, validate_middleware_1.validate)(collectionAgency_validator_1.updateCollectionAgencyStatusSchema), collectionAgency_controller_1.updateCollectionAgencyStatus);
router.delete('/:id', (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.collection_agency_management, 'delete'), (0, validate_middleware_1.validate)(collectionAgency_validator_1.deleteCollectionAgencySchema), collectionAgency_controller_1.deleteCollectionAgency);
exports.default = router;
