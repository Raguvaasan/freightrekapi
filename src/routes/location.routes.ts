import { Router } from 'express';
import {
  getCountries,
  getStates,
  getCities,
  createCountry,
  createState,
  createCity
} from '../controllers/location.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/checkPermission.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCountrySchema,
  createStateSchema,
  createCitySchema
} from '../validators/location.validator';
import { adminModule } from '../config/adminModule';

const router = Router();

// Public routes - Get location data
router.get('/countries', getCountries);
router.get('/states', getStates); // Query param: countryId
router.get('/cities', getCities); // Query param: stateId

// Admin routes - Create location data
router.post(
  '/countries',
  authMiddleware,
  checkPermission(adminModule.access_management, 'write'),
  validate(createCountrySchema),
  createCountry
);

router.post(
  '/states',
  authMiddleware,
  checkPermission(adminModule.access_management, 'write'),
  validate(createStateSchema),
  createState
);

router.post(
  '/cities',
  authMiddleware,
  checkPermission(adminModule.access_management, 'write'),
  validate(createCitySchema),
  createCity
);

export default router;
