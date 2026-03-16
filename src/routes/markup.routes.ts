import { Router } from 'express';
import {
  getRateCalculatorMarkup,
  createOrUpdateRateCalculatorMarkup,
  getRateCardMarkup,
  createOrUpdateRateCardMarkup,
} from '../controllers/markup.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/checkPermission.middleware';
import { validate } from '../middleware/validate.middleware';
import { createMarkupSchema } from '../validators/markup.validator';
import { adminModule } from '../config/adminModule';

const router = Router();

// Public Route for Frontend (No Token Required)
router.get('/public/rate-card-markup', getRateCardMarkup);

// Rate Calculator Markup Routes
router.get(
  '/rate-calculator-markup',
  authMiddleware,
  getRateCalculatorMarkup
);

router.post(
  '/rate-calculator-markup',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  validate(createMarkupSchema),
  createOrUpdateRateCalculatorMarkup
);

// Rate Card Markup Routes
router.get(
  '/rate-card-markup',
  authMiddleware,
  getRateCardMarkup
);

router.post(
  '/rate-card-markup',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  validate(createMarkupSchema),
  createOrUpdateRateCardMarkup
);

export default router;
