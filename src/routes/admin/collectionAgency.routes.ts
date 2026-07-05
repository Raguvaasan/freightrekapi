import { Router } from 'express';
import {
  createCollectionAgency,
  getAllCollectionAgencies,
  getCollectionAgencyById,
  updateCollectionAgency,
  deleteCollectionAgency,
  updateCollectionAgencyStatus,
} from '../../controllers/admin/collectionAgency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createCollectionAgencySchema,
  updateCollectionAgencySchema,
  updateCollectionAgencyStatusSchema,
  getCollectionAgencyByIdSchema,
  deleteCollectionAgencySchema,
} from '../../validators/admin/collectionAgency.validator';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { adminModule } from '../../config/adminModule';

const router = Router();

// All routes require authentication
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
