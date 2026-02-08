import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as franchiseRoleController from '../../controllers/admin/franchiseRole.controller';
import {
  createFranchiseRoleSchema,
  updateFranchiseRoleSchema,
} from '../../validators/admin/franchiseRole.validator';

const router = Router();

/**
 * @route   POST /admin/franchise/role
 * @desc    Create a new franchise role
 * @access  Private (Franchise only)
 */
router.post(
  '/',
  authMiddleware,
  validate(createFranchiseRoleSchema),
  franchiseRoleController.createFranchiseRole
);

/**
 * @route   GET /admin/franchise/role
 * @desc    Get all franchise roles
 * @access  Private (Franchise only)
 */
router.get('/', authMiddleware, franchiseRoleController.getFranchiseRoles);

/**
 * @route   GET /admin/franchise/role/:id
 * @desc    Get franchise role by ID
 * @access  Private (Franchise only)
 */
router.get('/:id', authMiddleware, franchiseRoleController.getFranchiseRoleById);

/**
 * @route   PUT /admin/franchise/role/:id
 * @desc    Update franchise role
 * @access  Private (Franchise only)
 */
router.put(
  '/:id',
  authMiddleware,
  validate(updateFranchiseRoleSchema),
  franchiseRoleController.updateFranchiseRole
);

/**
 * @route   DELETE /admin/franchise/role/:id
 * @desc    Delete franchise role
 * @access  Private (Franchise only)
 */
router.delete('/:id', authMiddleware, franchiseRoleController.deleteFranchiseRole);

export default router;
