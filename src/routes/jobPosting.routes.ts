import { Router } from 'express';
import {
  getAllJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting
} from '../controllers/jobPosting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/checkPermission.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createJobPostingSchema,
  updateJobPostingSchema
} from '../validators/jobPosting.validator';
import { adminModule } from '../config/adminModule';

const router = Router();

// Public routes - Get job postings
router.get('/', getAllJobPostings);
router.get('/:id', getJobPostingById);

// Admin routes - Create, update, delete job postings
router.post(
  '/',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  validate(createJobPostingSchema),
  createJobPosting
);

router.put(
  '/:id',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  validate(updateJobPostingSchema),
  updateJobPosting
);

router.delete(
  '/:id',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  deleteJobPosting
);

export default router;
