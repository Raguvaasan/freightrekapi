import { Router } from 'express';
import {
  createCollectionAgency,
  getAllCollectionAgencies,
  getCollectionAgencyById,
  updateCollectionAgency,
  deleteCollectionAgency,
  updateCollectionAgencyStatus,
  sendCollectionAgencyOtp,
  verifyCollectionAgencyOtp,
} from '../../controllers/admin/collectionAgency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createCollectionAgencySchema,
  updateCollectionAgencySchema,
  updateCollectionAgencyStatusSchema,
  getCollectionAgencyByIdSchema,
  deleteCollectionAgencySchema,
  collectionAgencySendOtpSchema,
  collectionAgencyVerifyOtpSchema,
} from '../../validators/admin/collectionAgency.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';
import collectionAgencyStaffRoutes from './collectionAgency-staff.routes';
import collectionAgencyRoleRoutes from './collectionAgencyRole.routes';
import collectionAgencyOrderRoutes from './collectionAgency-order.routes';

const router = Router();

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
router.post('/login/send-otp', validate(collectionAgencySendOtpSchema), sendCollectionAgencyOtp);
router.post('/login/verify-otp', validate(collectionAgencyVerifyOtpSchema), verifyCollectionAgencyOtp);

// Collection agency portal sub-routes (authenticated with the collection agency's own JWT).
// Mounted BEFORE the admin authMiddleware and the '/:id' routes so '/staff' and '/role'
// are matched as literal paths instead of being treated as an ':id'.
router.use('/staff', collectionAgencyStaffRoutes);
router.use('/role', collectionAgencyRoleRoutes);
router.use('/orders', collectionAgencyOrderRoutes);

// All remaining routes require admin authentication
router.use(authMiddleware);

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
router.post(
  '/',
  checkPermission(adminModule.collection_agency_management, 'write'),
  validate(createCollectionAgencySchema),
  createCollectionAgency
);

router.get(
  '/',
  checkPermission(adminModule.collection_agency_management, 'read'),
  getAllCollectionAgencies
);

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
router.get(
  '/:id',
  checkPermission(adminModule.collection_agency_management, 'read'),
  validate(getCollectionAgencyByIdSchema),
  getCollectionAgencyById
);

router.put(
  '/:id',
  checkPermission(adminModule.collection_agency_management, 'update'),
  validate(updateCollectionAgencySchema),
  updateCollectionAgency
);

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
router.patch(
  '/:id/status',
  checkPermission(adminModule.collection_agency_management, 'update'),
  validate(updateCollectionAgencyStatusSchema),
  updateCollectionAgencyStatus
);

router.delete(
  '/:id',
  checkPermission(adminModule.collection_agency_management, 'delete'),
  validate(deleteCollectionAgencySchema),
  deleteCollectionAgency
);

export default router;
