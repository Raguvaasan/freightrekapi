import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  getHubStaff,
  getHubStaffById,
  createHubStaff,
  updateHubStaff,
  deleteHubStaff,
  updateHubStaffStatus,
} from '../../controllers/hub/hubManageStaff.controller';
import {
  createHubStaffSchema,
  updateHubStaffSchema,
} from '../../validators/hub/hubManageStaff.validator';

import {
  requireParcelRole,
  requireModulePermission,
} from '../../middleware/parcelActor.middleware';
import { hubModule, hubPermission } from '../../config/hubModule';

const router = Router();

router.use(authMiddleware);
router.use(requireParcelRole('hub'));

/**
 * A direct hub login manages its own staff; hub staff need the matching
 * "Staff Management" permission on their HubRole.
 */
const staff = (action: 'read' | 'write' | 'update' | 'delete') =>
  requireModulePermission({ hub: hubPermission(hubModule.staff_management) }, action);

// GET /hub/manage/staff           - List hub's own staff
router.get('/', staff('read'), getHubStaff);

// GET /hub/manage/staff/:id       - Get hub staff by ID
router.get('/:id', staff('read'), getHubStaffById);

// POST /hub/manage/staff          - Create hub staff
router.post('/', staff('write'), validate(createHubStaffSchema), createHubStaff);

// PUT /hub/manage/staff/:id       - Edit hub staff
router.put('/:id', staff('update'), validate(updateHubStaffSchema), updateHubStaff);

// DELETE /hub/manage/staff/:id    - Delete hub staff
router.delete('/:id', staff('delete'), deleteHubStaff);

// PATCH /hub/manage/staff/:id/status  - Update staff status
router.patch('/:id/status', staff('update'), updateHubStaffStatus);

export default router;
