import { Router } from 'express';
import {
  getAgencyUsers,
  getAgencyUserById,
  createAgencyUser,
  updateAgencyUser,
  updateAgencyUserStatus,
  deleteAgencyUser,
} from '../../controllers/admin/agencyUser.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { agencyModule, agencyPermission } from '../../config/agencyModule';
import { validate } from '../../middleware/validate.middleware';
import {
  getStaffByIdSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  deleteStaffSchema,
} from '../../validators/admin/staff.validator';
import * as yup from 'yup';

/**
 * Users of an agency — base: /admin/agency/users
 *
 * Several users can share one agency, each with their own phone number, and
 * each logs in through the single phone login at /admin/login. `type` and the
 * agency are set from the caller's token, so they are not accepted in the body.
 */
const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('agency'));

/**
 * A direct agency login manages its own users; agency staff need the matching
 * "Staff Management" permission on their FranchiseRole.
 */
const staff = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission({ agency: agencyPermission(agencyModule.staff_management) }, action);

// Same fields as staff creation, minus everything derived from the token
const createAgencyUserSchema = yup.object({
  body: yup.object({
    name: yup
      .string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim(),
    email: yup
      .string()
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .trim()
      .optional(),
    roleId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    username: yup.string().min(3).max(50).trim().optional(),
    password: yup.string().min(6).max(100).optional(),
  }),
});

/**
 * @swagger
 * /admin/agency/users:
 *   get:
 *     summary: List this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
 *       - in: query
 *         name: roleId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Users of this agency }
 *       403: { description: Agency access required }
 *   post:
 *     summary: Add a user to this agency
 *     description: >
 *       Only a name and phone number are needed — the user then logs in with
 *       that number through /admin/login/send-otp. The phone must be unused
 *       across the whole system. Email, username and password are optional.
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, example: "Priya" }
 *               phone: { type: string, example: "9876500011" }
 *               email: { type: string }
 *               roleId: { type: string, description: FranchiseRole ObjectId }
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       201: { description: User created; can log in by phone }
 *       400: { description: Validation error / phone already registered }
 */
router.get('/', staff('read'), getAgencyUsers);
router.post('/', staff('write'), validate(createAgencyUserSchema), createAgencyUser);

/**
 * @swagger
 * /admin/agency/users/{id}:
 *   get:
 *     summary: Get one of this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User details }
 *       403: { description: User belongs to another agency }
 *   put:
 *     summary: Update one of this agency's users
 *     description: >
 *       `type`, `franchiseId`, `hubId` are ignored — a user cannot be moved to
 *       another agency from here.
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: User belongs to another agency }
 *   delete:
 *     summary: Remove one of this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Cannot delete the logged-in user }
 */
router.get('/:id', staff('read'), validate(getStaffByIdSchema), getAgencyUserById);
router.put('/:id', staff('update'), validate(updateStaffSchema), updateAgencyUser);
router.delete('/:id', staff('delete'), validate(deleteStaffSchema), deleteAgencyUser);

/**
 * @swagger
 * /admin/agency/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate one of this agency's users
 *     tags: [Agency Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/:id/status', staff('update'), validate(updateStaffStatusSchema), updateAgencyUserStatus);

export default router;
