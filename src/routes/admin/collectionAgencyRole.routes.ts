import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as collectionAgencyRoleController from '../../controllers/admin/collectionAgencyRole.controller';
import {
  createCollectionAgencyRoleSchema,
  updateCollectionAgencyRoleSchema,
} from '../../validators/admin/collectionAgencyRole.validator';

const router = Router();

/**
 * @route   POST /admin/collection-agency/role
 * @desc    Create a new collection agency role
 * @access  Private (Collection Agency only)
 */
router.post(
  '/',
  authMiddleware,
  validate(createCollectionAgencyRoleSchema),
  collectionAgencyRoleController.createCollectionAgencyRole
);

/**
 * @route   GET /admin/collection-agency/role
 * @desc    Get all collection agency roles
 * @access  Private (Collection Agency only)
 */
router.get('/', authMiddleware, collectionAgencyRoleController.getCollectionAgencyRoles);

/**
 * @route   GET /admin/collection-agency/role/:id
 * @desc    Get collection agency role by ID
 * @access  Private (Collection Agency only)
 */
router.get('/:id', authMiddleware, collectionAgencyRoleController.getCollectionAgencyRoleById);

/**
 * @route   PUT /admin/collection-agency/role/:id
 * @desc    Update collection agency role
 * @access  Private (Collection Agency only)
 */
router.put(
  '/:id',
  authMiddleware,
  validate(updateCollectionAgencyRoleSchema),
  collectionAgencyRoleController.updateCollectionAgencyRole
);

/**
 * @route   DELETE /admin/collection-agency/role/:id
 * @desc    Delete collection agency role
 * @access  Private (Collection Agency only)
 */
router.delete('/:id', authMiddleware, collectionAgencyRoleController.deleteCollectionAgencyRole);

export default router;
