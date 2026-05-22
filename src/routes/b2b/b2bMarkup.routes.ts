import { Router } from 'express';
import {
  getB2bRateCalculatorMarkup,
  createOrUpdateB2bRateCalculatorMarkup,
  getB2bRateCardMarkup,
  createOrUpdateB2bRateCardMarkup,
  deleteB2bMarkup,
} from '../../controllers/b2b/b2bMarkup.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/checkPermission.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createB2bMarkupSchema } from '../../validators/b2b/b2bMarkup.validator';
import { adminModule } from '../../config/adminModule';

const router = Router();

// B2B Rate Calculator Markup Routes
router.get(
  '/rate-calculator-markup',
  authMiddleware,
  getB2bRateCalculatorMarkup
);

router.post(
  '/rate-calculator-markup',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  validate(createB2bMarkupSchema),
  createOrUpdateB2bRateCalculatorMarkup
);

// B2B Rate Card Markup Routes
router.get(
  '/rate-card-markup',
  authMiddleware,
  getB2bRateCardMarkup
);

router.post(
  '/rate-card-markup',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  validate(createB2bMarkupSchema),
  createOrUpdateB2bRateCardMarkup
);

// Delete B2B Markup
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(adminModule.settings, 'write'),
  deleteB2bMarkup
);

export default router;
