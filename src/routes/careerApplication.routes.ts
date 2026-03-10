import { Router } from 'express';
import * as careerApplicationController from '../controllers/careerApplication.controller';
import { validate } from '../middleware/validate.middleware';
import { createCareerApplicationSchema, updateCareerApplicationSchema } from '../validators/careerApplication.validator';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
// List all applications - with optional filters
router.get('/', careerApplicationController.getAllApplications);

// Get application by ID
router.get('/:id', careerApplicationController.getApplicationById);

// Create new application (public - anyone can apply)
router.post(
  '/',
  validate(createCareerApplicationSchema),
  careerApplicationController.createApplication
);

// Get applications by job posting (public)
router.get('/job-posting/:jobPostingId', careerApplicationController.getApplicationsByJobPosting);

// Admin-only routes
// Update application (admin only - can update status and details)
router.put(
  '/:id',
  authMiddleware,
  validate(updateCareerApplicationSchema),
  careerApplicationController.updateApplication
);

// Delete application (admin only)
router.delete('/:id', authMiddleware, careerApplicationController.deleteApplication);

export default router;
