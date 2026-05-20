import { Router } from 'express';
import { signup, login } from '../../controllers/customer/emailAuth.controller';
import { validate } from '../../middleware/validate.middleware';
import {
  customerEmailSignupSchema,
  customerEmailLoginSchema,
} from '../../validators/customerEmailAuth.validator';

const router = Router();

// POST /api/customer/email-auth/signup
router.post('/signup', validate(customerEmailSignupSchema), signup);

// POST /api/customer/email-auth/login
router.post('/login', validate(customerEmailLoginSchema), login);

export default router;
