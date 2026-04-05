import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as hubRoleController from '../../controllers/hub/hubRole.controller';
import {
  createHubRoleSchema,
  updateHubRoleSchema,
} from '../../validators/hub/hubRole.validator';

const router = Router();

/**
 * @route   POST /hub/role
 * @desc    Create a new hub role
 * @access  Private (Hub only)
 */
router.post(
  '/',
  authMiddleware,
  validate(createHubRoleSchema),
  hubRoleController.createHubRole
);

/**
 * @route   GET /hub/role
 * @desc    Get all hub roles
 * @access  Private (Hub only)
 */
router.get('/', authMiddleware, hubRoleController.getHubRoles);

/**
 * @route   GET /hub/role/:id
 * @desc    Get hub role by ID
 * @access  Private (Hub only)
 */
router.get('/:id', authMiddleware, hubRoleController.getHubRoleById);

/**
 * @route   PUT /hub/role/:id
 * @desc    Update hub role
 * @access  Private (Hub only)
 */
router.put(
  '/:id',
  authMiddleware,
  validate(updateHubRoleSchema),
  hubRoleController.updateHubRole
);

/**
 * @route   DELETE /hub/role/:id
 * @desc    Delete hub role
 * @access  Private (Hub only)
 */
router.delete('/:id', authMiddleware, hubRoleController.deleteHubRole);

export default router;
