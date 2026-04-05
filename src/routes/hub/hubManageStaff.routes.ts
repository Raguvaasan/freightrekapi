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

const router = Router();

router.use(authMiddleware);

// GET /hub/manage/staff           - List hub's own staff
router.get('/', getHubStaff);

// GET /hub/manage/staff/:id       - Get hub staff by ID
router.get('/:id', getHubStaffById);

// POST /hub/manage/staff          - Create hub staff
router.post('/', validate(createHubStaffSchema), createHubStaff);

// PUT /hub/manage/staff/:id       - Edit hub staff
router.put('/:id', validate(updateHubStaffSchema), updateHubStaff);

// DELETE /hub/manage/staff/:id    - Delete hub staff
router.delete('/:id', deleteHubStaff);

// PATCH /hub/manage/staff/:id/status  - Update staff status
router.patch('/:id/status', updateHubStaffStatus);

export default router;
