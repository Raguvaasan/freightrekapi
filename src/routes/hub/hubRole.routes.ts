import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as hubRoleController from '../../controllers/hub/hubRole.controller';
import {
  createHubRoleSchema,
  updateHubRoleSchema,
} from '../../validators/hub/hubRole.validator';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import {
  hubModule,
  hubModules,
  hubPermission,
} from '../../config/hubModule';

const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('hub'));

/**
 * A direct hub login manages its own roles; hub staff need the matching
 * "Access Management" permission on their HubRole.
 */
const access = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission({ hub: hubPermission(hubModule.access_management) }, action);

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
router.get('/modules', access('read'), (_req, res) =>
  res.status(200).json({ success: true, data: { modules: hubModules() } })
);

/**
 * @route   POST /hub/role
 * @desc    Create a new hub role
 * @access  Private (Hub only)
 */
router.post(
  '/',
  access('write'),
  validate(createHubRoleSchema),
  hubRoleController.createHubRole
);

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
router.put(
  '/:id',
  access('update'),
  validate(updateHubRoleSchema),
  hubRoleController.updateHubRole
);

/**
 * @route   DELETE /hub/role/:id
 * @desc    Delete hub role
 * @access  Private (Hub only)
 */
router.delete('/:id', access('delete'), hubRoleController.deleteHubRole);

export default router;
