"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const checkPermission_middleware_1 = require("../middleware/checkPermission.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const location_validator_1 = require("../validators/location.validator");
const adminModule_1 = require("../config/adminModule");
const router = (0, express_1.Router)();
// Public routes - Get location data
router.get('/countries', location_controller_1.getCountries);
router.get('/states', location_controller_1.getStates); // Query param: countryId
router.get('/cities', location_controller_1.getCities); // Query param: stateId
// Admin routes - Create location data
router.post('/countries', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'write'), (0, validate_middleware_1.validate)(location_validator_1.createCountrySchema), location_controller_1.createCountry);
router.post('/states', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'write'), (0, validate_middleware_1.validate)(location_validator_1.createStateSchema), location_controller_1.createState);
router.post('/cities', auth_middleware_1.authMiddleware, (0, checkPermission_middleware_1.checkPermission)(adminModule_1.adminModule.access_management, 'write'), (0, validate_middleware_1.validate)(location_validator_1.createCitySchema), location_controller_1.createCity);
exports.default = router;
