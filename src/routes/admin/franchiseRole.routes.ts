import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as franchiseRoleController from '../../controllers/admin/franchiseRole.controller';
import {
  createFranchiseRoleSchema,
  updateFranchiseRoleSchema,
} from '../../validators/admin/franchiseRole.validator';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import {
  agencyModule,
  agencyModules,
  agencyPermission,
} from '../../config/agencyModule';

const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('agency'));

/**
 * A direct agency login manages its own roles; agency staff need the matching
 * "Access Management" permission on their FranchiseRole.
 */
const access = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission({ agency: agencyPermission(agencyModule.access_management) }, action);

/**
 * @swagger
 * /admin/franchise/role/modules:
 *   get:
 *     summary: Modules an agency role can be given permissions on
 *     description: Drives the agency role/permission screen.
 *     tags: [Franchise Role]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: '{ modules: ["Dashboard", "Parcel Management", ...] }'
 */
router.get('/modules', access('read'), (_req, res) =>
  res.status(200).json({ success: true, data: { modules: agencyModules() } })
);

/**
 * @route   POST /admin/franchise/role
 * @desc    Create a new franchise role
 * @access  Private (Franchise only)
 */
router.post(
  '/',
  access('write'),
  validate(createFranchiseRoleSchema),
  franchiseRoleController.createFranchiseRole
);

/**
 * @route   GET /admin/franchise/role
 * @desc    Get all franchise roles
 * @access  Private (Franchise only)
 */
router.get('/', access('read'), franchiseRoleController.getFranchiseRoles);

/**
 * @route   GET /admin/franchise/role/:id
 * @desc    Get franchise role by ID
 * @access  Private (Franchise only)
 */
router.get('/:id', access('read'), franchiseRoleController.getFranchiseRoleById);

/**
 * @route   PUT /admin/franchise/role/:id
 * @desc    Update franchise role
 * @access  Private (Franchise only)
 */
router.put(
  '/:id',
  access('update'),
  validate(updateFranchiseRoleSchema),
  franchiseRoleController.updateFranchiseRole
);

/**
 * @route   DELETE /admin/franchise/role/:id
 * @desc    Delete franchise role
 * @access  Private (Franchise only)
 */
router.delete('/:id', access('delete'), franchiseRoleController.deleteFranchiseRole);

export default router;
